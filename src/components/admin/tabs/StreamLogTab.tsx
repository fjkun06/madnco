"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  LOG_NOTES_MAX,
  LOG_PLATFORMS,
  LOG_TEXT_MAX,
  PERIODS,
  PLATFORM_FIELDS,
  GOAL_RESULTS,
  dayBuckets,
  durationMinutes,
  emptyEntry,
  entriesIn,
  entryMinutes,
  entryTotal,
  followersByBucket,
  formatMinutes,
  hourBuckets,
  hoursByBucket,
  isoWeek,
  periodRange,
  shiftAnchor,
  totals,
  type GoalResult,
  type Period,
  type PlatformField,
  type StreamLogEntry,
  type Totals,
} from "@/lib/stream/streamLog";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { Card } from "../Card";
import { DatePicker } from "../DatePicker";
import { errorText } from "../errors";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "../fields";
import { TimePicker } from "../TimePicker";
import { formatDay, toDateValue } from "../time";
import { useGameLive } from "../useGameLive";
import { Bars, Legend, Lines, PLATFORM_COLOR, SplitBar, StackedBars, platformLegend } from "../streamlog/charts";
import type { TabProps } from "./shared";

const t = en.admin.log;
const f = t.form;
const w = en.admin.when;

/** Load / save / delete through /api/admin/streamlog. */
function useStreamLog(onError: (msg: string) => void) {
  const [entries, setEntries] = useState<StreamLogEntry[] | null>(null);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    let stop = false;
    fetch("/api/admin/streamlog", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { entries?: StreamLogEntry[]; error?: string };
        if (stop) return;
        if (!res.ok || !body.entries) {
          fail(errorText(body.error));
          setEntries([]);
          return;
        }
        setEntries(body.entries);
      })
      .catch(() => {
        if (!stop) {
          fail(errorText());
          setEntries([]);
        }
      });
    return () => {
      stop = true;
    };
  }, []);

  async function call(method: "POST" | "DELETE", body: unknown) {
    const res = await fetch("/api/admin/streamlog", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { entry?: StreamLogEntry; error?: string };
    if (!res.ok) throw new Error(errorText(json.error));
    return json;
  }

  return {
    entries,
    save: async (entry: StreamLogEntry) => {
      const { entry: saved } = await call("POST", { entry });
      if (!saved) throw new Error(errorText());
      setEntries((list) => [...(list ?? []).filter((e) => e.id !== saved.id), saved]);
      return saved;
    },
    remove: async (id: string) => {
      await call("DELETE", { id });
      setEntries((list) => (list ?? []).filter((e) => e.id !== id));
    },
  };
}

const monthName = (m: number) => w.months[m - 1];
const shortDay = (date: string) => `${Number(date.slice(8))} ${monthName(Number(date.slice(5, 7))).slice(0, 3)}`;

function periodLabel(period: Period, anchor: string): string {
  const range = periodRange(period, anchor);
  const [y, m] = anchor.split("-").map(Number);
  if (period === "year") return String(y);
  if (period === "month") return `${monthName(m)} ${y}`;
  return interpolate(t.weekOf, { week: isoWeek(range.from), from: shortDay(range.from), to: shortDay(range.to) });
}

type Kpi = { key: string; label: string; value: string; delta: number | null; deltaText?: string; sub?: string };

function kpis(now: Totals, before: Totals): Kpi[] {
  // No arrow when there is nothing to compare with (nothing logged before).
  const d = (a: number | null, b: number | null) =>
    a === null || b === null || before.streams === 0 ? null : Math.round((a - b) * 10) / 10;
  return [
    { key: "streams", label: t.kpi.streams, value: String(now.streams), delta: d(now.streams, before.streams) },
    {
      key: "hours",
      label: t.kpi.hours,
      value: `${Math.round((now.minutes / 60) * 10) / 10} h`,
      delta: d(now.minutes / 60, before.minutes / 60),
      deltaText: " h",
    },
    { key: "followers", label: t.kpi.followers, value: String(now.newFollowers), delta: d(now.newFollowers, before.newFollowers) },
    {
      key: "viewers",
      label: t.kpi.viewers,
      value: now.avgViewers === null ? "—" : String(now.avgViewers),
      delta: d(now.avgViewers, before.avgViewers),
      sub: t.allPlatforms,
    },
    { key: "comments", label: t.kpi.comments, value: String(now.comments), delta: d(now.comments, before.comments) },
    {
      key: "fph",
      label: t.kpi.fph,
      value: now.followersPerHour === null ? "—" : String(now.followersPerHour),
      delta: d(now.followersPerHour, before.followersPerHour),
      sub: now.best ? interpolate(t.best, { date: shortDay(now.best.date), value: now.best.value }) : undefined,
    },
  ];
}

function DeltaLine({ kpi }: { kpi: Kpi }) {
  if (kpi.delta === null || kpi.delta === 0) {
    return <span className="text-xs text-muted">{kpi.sub ?? " "}</span>;
  }
  const up = kpi.delta > 0;
  return (
    <span className="text-xs text-muted">
      <span className={up ? "text-[#0ca30c]" : "text-muted"}>
        <span aria-hidden="true">{up ? "▲" : "▼"}</span> {Math.abs(kpi.delta)}
        {kpi.deltaText ?? ""}
      </span>{" "}
      {t.vs}
      {kpi.sub ? ` · ${kpi.sub}` : ""}
    </span>
  );
}

const GOAL_TONE: Record<GoalResult, string> = {
  reached: "bg-[#0ca30c] text-white",
  partly: "bg-[#fab219] text-ink",
  missed: "bg-[#d03b3b] text-white",
  none: "bg-ink-3 text-muted",
};

export function StreamLogTab({ form, now, push }: TabProps) {
  const today = now ? toDateValue(now) : "";
  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState("");
  const [editing, setEditing] = useState<StreamLogEntry | null>(null);
  const log = useStreamLog((msg) => push("error", t.listTitle, msg));
  const formRef = useRef<HTMLDivElement>(null);

  const at = anchor || today || "2026-01-01";
  const range = periodRange(period, at);
  const prevRange = periodRange(period, shiftAnchor(period, at, -1));
  const all = log.entries ?? [];
  const inPeriod = entriesIn(all, range);
  const sum = totals(inPeriod);
  const before = totals(entriesIn(all, prevRange));
  const months = w.months;
  const days = w.weekdaysShort;

  const followerRows = followersByBucket(inPeriod, dayBuckets(period, range, months, days)).map((row) => ({
    label: row.bucket.label,
    title: period === "year" ? `${monthName(Number(row.bucket.key.slice(5)))} ${row.bucket.key.slice(0, 4)}` : formatDay(row.bucket.key),
    values: row.values,
  }));
  const hourRows = hoursByBucket(inPeriod, hourBuckets(period, range, months, days)).map((row) => ({
    label: row.bucket.label,
    title: row.bucket.from === row.bucket.to ? formatDay(row.bucket.from) : `${shortDay(row.bucket.from)} – ${shortDay(row.bucket.to)}`,
    value: row.hours,
  }));
  const linePoints = inPeriod.map((e) => ({
    label: shortDay(e.date),
    values: Object.fromEntries(LOG_PLATFORMS.map((p) => [p, e.platforms[p].avg])) as Record<(typeof LOG_PLATFORMS)[number], number | null>,
    details: (
      <>
        <p className="m-0 font-bold">
          {formatDay(e.date)}
          {e.game ? ` · ${e.game}` : ""}
        </p>
        <p className="m-0 text-muted">
          {LOG_PLATFORMS.map((p) => `${t.platforms[p]} ${e.platforms[p].avg ?? "–"}`).join(" · ")}
        </p>
        <p className="m-0 text-muted">
          {entryTotal(e, "newFollowers") ?? 0} {t.kpi.followers.toLowerCase()} · {entryTotal(e, "comments") ?? 0}{" "}
          {t.kpi.comments.toLowerCase()}
        </p>
        {e.goal !== "none" ? (
          <p className="m-0 text-muted">
            {f.goal}: {t.goals[e.goal]}
          </p>
        ) : null}
      </>
    ),
  }));
  const hasViewers = linePoints.some((p) => LOG_PLATFORMS.some((k) => p.values[k] !== null));
  const uniqueTotal = LOG_PLATFORMS.reduce((a, p) => a + sum.unique[p], 0);

  function openForm(entry: StreamLogEntry) {
    setEditing(entry);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Period bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t.periodLabel} className="flex bg-ink-2 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={`${CHIP_SM} ${period === p ? "bg-ink-3 text-paper" : "text-muted hover:text-paper"}`}
            >
              {t[p]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t.prev} onClick={() => setAnchor(shiftAnchor(period, at, -1))} className={`${CHIP_SM} ${CHIP_OFF} min-w-10 text-base`}>
            ‹
          </button>
          <span aria-live="polite" className="min-w-40 text-center font-display text-2xl leading-none">
            {periodLabel(period, at)}
          </span>
          <button type="button" aria-label={t.next} onClick={() => setAnchor(shiftAnchor(period, at, 1))} className={`${CHIP_SM} ${CHIP_OFF} min-w-10 text-base`}>
            ›
          </button>
          <button type="button" onClick={() => setAnchor("")} className={`${CHIP_SM} text-muted hover:text-paper`}>
            {t.today}
          </button>
        </div>
        <button
          type="button"
          onClick={() => openForm(emptyEntry(today))}
          className={`${CHIP} ${CHIP_ON} ml-auto`}
        >
          {t.add}
        </button>
      </div>

      {editing ? (
        <div ref={formRef} className="scroll-mt-40">
          <LogForm
            key={editing.id || "new"}
            initial={editing}
            now={now}
            games={form.games.list.map((g) => g.name)}
            currentGame={form.games.list.find((g) => g.id === form.games.current) ?? null}
            co={form.co.name}
            onCancel={() => setEditing(null)}
            onSave={async (entry) => {
              try {
                await log.save(entry);
                push("ok", f.saved, `${formatDay(entry.date)} · ${entry.start}–${entry.end}`);
                setEditing(null);
                setAnchor(entry.date);
              } catch (error) {
                push("error", f.saved, (error as Error).message);
              }
            }}
            onDelete={
              editing.id
                ? async () => {
                    try {
                      await log.remove(editing.id);
                      push("ok", f.deleted, formatDay(editing.date));
                      setEditing(null);
                    } catch (error) {
                      push("error", f.deleted, (error as Error).message);
                    }
                  }
                : undefined
            }
          />
        </div>
      ) : null}

      {log.entries === null ? (
        <p className="m-0 label-mono text-xs font-extrabold text-muted">{t.loading}</p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {kpis(sum, before).map((k) => (
              <div key={k.key} className="flex flex-col gap-1 bg-ink-2 px-4 py-3">
                <span className="label-mono text-[10px] font-extrabold text-muted">{k.label}</span>
                <span className="text-3xl leading-tight font-bold tabular-nums">{k.value}</span>
                <DeltaLine kpi={k} />
              </div>
            ))}
          </div>

          {inPeriod.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3 bg-ink-2 px-5 py-6">
              <p className="m-0 text-muted">{t.empty}</p>
              <button type="button" onClick={() => openForm(emptyEntry(today))} className={`${CHIP_SM} ${CHIP_OFF}`}>
                {t.emptyCta}
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="flex flex-col gap-2 bg-ink-2 p-5">
              <h3 className="m-0 text-base font-bold">{t.followersTitle}</h3>
              <p className="m-0 text-sm text-muted">{t.followersHint}</p>
              <Legend items={platformLegend()} />
              <StackedBars rows={followerRows} ariaLabel={`${t.followersTitle}, ${periodLabel(period, at)}: ${sum.newFollowers}`} />
            </section>
            <section className="flex flex-col gap-2 bg-ink-2 p-5">
              <h3 className="m-0 text-base font-bold">{t.sourcesTitle}</h3>
              <p className="m-0 text-sm text-muted">{t.sourcesHint}</p>
              {uniqueTotal ? (
                <>
                  <SplitBar values={sum.unique} />
                  <Legend items={platformLegend(Object.fromEntries(LOG_PLATFORMS.map((p) => [p, String(sum.unique[p])])))} />
                </>
              ) : (
                <p className="m-0 text-sm text-muted">{t.sourcesNone}</p>
              )}
              <h3 className="m-0 mt-4 text-base font-bold">{t.hoursTitle}</h3>
              <Bars rows={hourRows} unit="h" ariaLabel={`${t.hoursTitle}, ${periodLabel(period, at)}`} />
            </section>
          </div>

          <section className="flex flex-col gap-2 bg-ink-2 p-5">
            <h3 className="m-0 text-base font-bold">{t.viewersTitle}</h3>
            <p className="m-0 text-sm text-muted">{t.viewersHint}</p>
            {hasViewers ? (
              <>
                <Legend items={platformLegend()} />
                <Lines points={linePoints} ariaLabel={`${t.viewersTitle}, ${periodLabel(period, at)}`} />
              </>
            ) : (
              <p className="m-0 text-sm text-muted">{t.viewersNone}</p>
            )}
          </section>

          {inPeriod.length ? (
            <section className="flex flex-col gap-2 bg-ink-2 p-5">
              <h3 className="m-0 text-base font-bold">{t.listTitle}</h3>
              <p className="m-0 text-sm text-muted">{t.listHint}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="label-mono text-[10px] text-muted">
                      <th className="px-2 py-2 text-left font-extrabold">{t.cols.date}</th>
                      <th className="px-2 py-2 text-left font-extrabold">{t.cols.time}</th>
                      <th className="px-2 py-2 text-left font-extrabold">{t.cols.length}</th>
                      <th className="px-2 py-2 text-left font-extrabold">{t.cols.game}</th>
                      <th className="px-2 py-2 text-right font-extrabold">{t.cols.peak}</th>
                      <th className="px-2 py-2 text-right font-extrabold">{t.cols.followers}</th>
                      <th className="px-2 py-2 text-right font-extrabold">{t.cols.comments}</th>
                      <th className="px-2 py-2 text-left font-extrabold">{t.cols.goal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...inPeriod].reverse().map((e) => (
                      <tr
                        key={e.id}
                        tabIndex={0}
                        onClick={() => openForm(e)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openForm(e);
                          }
                        }}
                        className="cursor-pointer border-t border-ink-3 hover:bg-ink-3 focus-visible:bg-ink-3"
                      >
                        <td className="px-2 py-2.5">{formatDay(e.date)}</td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {e.start}–{e.end}
                        </td>
                        <td className="px-2 py-2.5">{formatMinutes(entryMinutes(e))}</td>
                        <td className="px-2 py-2.5">
                          {e.game || "—"}
                          {e.part !== null ? ` · ${e.part}` : ""}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          {LOG_PLATFORMS.map((p) => e.platforms[p].peak ?? "–").join(" · ")}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{entryTotal(e, "newFollowers") ?? "–"}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{entryTotal(e, "comments") ?? "–"}</td>
                        <td className="px-2 py-2.5">
                          <span className={`label-mono px-2 py-0.5 text-[10px] font-extrabold ${GOAL_TONE[e.goal]}`}>
                            {t.goals[e.goal]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

// ---------- the form ----------

const numText = (n: number | null) => (n === null ? "" : String(n));
const parseNum = (text: string): number | null => {
  const v = text.trim().replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  compact = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  compact?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode={step < 1 ? "decimal" : "numeric"}
      min={0}
      step={step}
      aria-label={label}
      value={numText(value)}
      onChange={(event) => onChange(parseNum(event.target.value))}
      className={`${INPUT} ${compact ? "min-h-11 px-3 text-base" : ""} [appearance:textfield] tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
    />
  );
}

function LogForm({
  initial,
  now,
  games,
  currentGame,
  co,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: StreamLogEntry;
  now: number;
  games: string[];
  currentGame: { id: string; name: string } | null;
  co: string;
  onCancel: () => void;
  onSave: (entry: StreamLogEntry) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [problem, setProblem] = useState("");
  const live = useGameLive(currentGame?.id ?? null, () => undefined);
  const set = (patch: Partial<StreamLogEntry>) => setDraft((d) => ({ ...d, ...patch }));
  const setPlatform = (p: (typeof LOG_PLATFORMS)[number], field: PlatformField, value: number | null) =>
    setDraft((d) => ({ ...d, platforms: { ...d.platforms, [p]: { ...d.platforms[p], [field]: value } } }));
  const minutes = durationMinutes(draft.start, draft.end);
  const overnight = minutes !== null && draft.end < draft.start;

  async function submit() {
    if (!draft.date || minutes === null) {
      setProblem(f.needTimes);
      return;
    }
    setProblem("");
    setBusy(true);
    try {
      await onSave(draft);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={initial.id ? f.editTitle : f.newTitle}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DatePicker id="log-date" label={f.date} value={draft.date} now={now} past onPick={(date) => set({ date })} />
        <TimePicker id="log-start" label={f.start} value={draft.start} onPick={(start) => set({ start })} />
        <TimePicker id="log-end" label={f.end} value={draft.end} onPick={(end) => set({ end })} />
        <div className="flex flex-col gap-2">
          <span className={LABEL}>{f.duration}</span>
          <div className="flex min-h-14 items-center gap-3 bg-ink-3 px-4 text-lg font-bold text-tq cut-s">
            {minutes === null ? "—" : formatMinutes(minutes)}
            {overnight ? <span className="label-mono text-[10px] font-extrabold text-muted">{f.overnight}</span> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.game}</span>
          <input
            type="text"
            list="log-games"
            maxLength={LOG_TEXT_MAX}
            value={draft.game}
            placeholder={f.gamePlaceholder}
            onChange={(event) => set({ game: event.target.value })}
            className={INPUT}
          />
          <datalist id="log-games">
            {games.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.part}</span>
          <NumberField label={f.part} value={draft.part} onChange={(part) => set({ part })} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.co}</span>
          <input
            type="text"
            maxLength={LOG_TEXT_MAX}
            value={draft.co}
            placeholder={f.coPlaceholder}
            onChange={(event) => set({ co: event.target.value })}
            className={INPUT}
          />
        </label>
      </div>
      {currentGame ? (
        <button
          type="button"
          onClick={() =>
            set({
              game: currentGame.name,
              part: live.live?.part ?? draft.part,
              counter: live.live?.c1 ?? draft.counter,
              co: co || draft.co,
            })
          }
          className={`${CHIP_SM} ${CHIP_OFF} self-start`}
        >
          {f.fromStream} ({currentGame.name})
        </button>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{f.perPlatform}</span>
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[150px_repeat(3,minmax(0,1fr))] items-center gap-2">
            <span />
            {LOG_PLATFORMS.map((p) => (
              <span key={p} className="flex items-center gap-2 label-mono text-[11px] font-extrabold">
                <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: PLATFORM_COLOR[p] }} />
                {t.platforms[p]}
              </span>
            ))}
            {PLATFORM_FIELDS.map((field) => (
              <PlatformRow key={field} field={field} draft={draft} setPlatform={setPlatform} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.counter}</span>
          <NumberField label={f.counter} value={draft.counter} onChange={(counter) => set({ counter })} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.clips}</span>
          <NumberField label={f.clips} value={draft.clips} onChange={(clips) => set({ clips })} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{f.raids}</span>
          <NumberField label={f.raids} value={draft.raids} onChange={(raids) => set({ raids })} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className={LABEL}>{f.goal}</span>
          <div role="group" aria-label={f.goal} className="flex flex-wrap gap-2">
            {GOAL_RESULTS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={draft.goal === g}
                onClick={() => set({ goal: g })}
                className={`${CHIP_SM} ${draft.goal === g ? CHIP_ON : CHIP_OFF}`}
              >
                {g === "none" ? f.noGoal : t.goals[g]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={LABEL}>{f.rating}</span>
          <div role="group" aria-label={f.rating} className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={draft.rating === n}
                onClick={() => set({ rating: draft.rating === n ? null : n })}
                className={`${CHIP_SM} min-w-11 ${draft.rating === n ? CHIP_ON : CHIP_OFF}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>{f.notes}</span>
        <textarea
          maxLength={LOG_NOTES_MAX}
          rows={3}
          value={draft.notes}
          placeholder={f.notesPlaceholder}
          onChange={(event) => set({ notes: event.target.value })}
          className={`${INPUT} min-h-24 py-3`}
        />
      </label>

      {problem ? <p className="m-0 label-mono text-xs font-extrabold text-live">{problem}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => void submit()} className={`${CHIP} ${CHIP_ON}`}>
          {busy ? f.saving : f.save}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className={`${CHIP} ${CHIP_OFF}`}>
          {f.cancel}
        </button>
        {onDelete ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirm) {
                setConfirm(true);
                return;
              }
              setBusy(true);
              void onDelete().finally(() => setBusy(false));
            }}
            className={`${CHIP} ml-auto ${confirm ? "bg-live text-ink" : CHIP_OFF}`}
          >
            {confirm ? f.confirmDelete : f.delete}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

function PlatformRow({
  field,
  draft,
  setPlatform,
}: {
  field: PlatformField;
  draft: StreamLogEntry;
  setPlatform: (p: (typeof LOG_PLATFORMS)[number], field: PlatformField, value: number | null) => void;
}) {
  return (
    <>
      <span className="text-sm text-muted">{f.fields[field]}</span>
      {LOG_PLATFORMS.map((p) => (
        <NumberField
          key={p}
          compact
          step={field === "avg" ? 0.1 : 1}
          label={`${t.platforms[p]} · ${f.fields[field]}`}
          value={draft.platforms[p][field]}
          onChange={(value) => setPlatform(p, field, value)}
        />
      ))}
    </>
  );
}
