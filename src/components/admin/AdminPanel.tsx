"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  GAME_CHIPS,
  GAME_MAX,
  PLAN_MAX,
  TOPIC_MAX,
  type LiveMode,
  type StreamState,
} from "@/lib/stream/state";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { BUTTON_PRIMARY } from "@/utils/ui.classes";
import { errorText } from "./errors";
import { fromDateTime, nextOccurrence, toDateValue, toTimeValue } from "./time";

const MODES: LiveMode[] = ["auto", "live", "off"];
const QUICK_MINUTES = [5, 10, 15];

const CARD = "flex flex-col gap-4 bg-ink-2 p-5 cut sm:p-7";
const LABEL = "label-mono text-xs font-extrabold text-muted";
const INPUT =
  "min-h-13 w-full border-2 border-ink-3 bg-ink px-4 text-lg text-paper outline-none cut-s placeholder:text-muted/70 focus:border-tq";
const CHIP =
  "focus-inset label-mono min-h-11 px-4 text-[13px] font-extrabold whitespace-nowrap cut-s transition-colors duration-200";
const CHIP_OFF = "bg-ink-3 text-paper hover:bg-bordeaux";
const CHIP_ON = "bg-tq text-ink";

type Status = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

/**
 * The control room. Edits stay local until "Save", which sends the whole
 * state; the server validates it and the overlays pick it up within seconds.
 */
export function AdminPanel({
  initial,
  storageReady,
  twitchReady,
}: {
  initial: StreamState;
  storageReady: boolean;
  twitchReady: boolean;
}) {
  const t = en.admin;
  const router = useRouter();
  const [draft, setDraft] = useState<StreamState>(initial);
  const [otherGame, setOtherGame] = useState(
    initial.game !== "" && !(GAME_CHIPS as readonly string[]).includes(initial.game),
  );
  const [nextDate, setNextDate] = useState(toDateValue(initial.next?.at));
  const [nextTime, setNextTime] = useState(toTimeValue(initial.next?.at));
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function update(patch: Partial<StreamState>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  }

  function updateNext(
    date: string,
    time: string,
    patch: { plan?: string; show?: boolean } = {},
  ) {
    const at = fromDateTime(date, time);
    const current = draft.next;
    update({
      next: at
        ? {
            at,
            plan: patch.plan ?? current?.plan ?? "",
            show: patch.show ?? current?.show ?? true,
          }
        : null,
    });
  }

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = (await res.json().catch(() => ({}))) as StreamState & {
        error?: string;
      };
      if (!res.ok) {
        setStatus({ kind: "error", message: errorText(body.error) });
        if (res.status === 401) router.refresh();
        return;
      }
      setDraft(body);
      setDirty(false);
      setStatus({ kind: "saved" });
    } catch {
      setStatus({ kind: "error", message: errorText() });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }

  const live = draft.mode === "live";
  const saveLabel =
    status.kind === "saving"
      ? t.saving
      : dirty
        ? t.unsaved
        : status.kind === "saved"
          ? t.saved
          : "";

  return (
    <div className="flex flex-col gap-8">
      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-4 border-b-2 border-ink-3 pb-5">
        <h1 className="m-0 font-display text-3xl leading-none">
          {t.title} <span className="text-tq">{t.titleAccent}</span>
        </h1>
        <span
          className={`inline-flex h-9 items-center gap-2.5 px-3.5 label-mono text-xs font-extrabold cut-s ${
            live ? "bg-live text-ink" : "bg-ink-3 text-muted"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-2.5 rounded-full ${live ? "bg-ink" : "bg-off"}`}
          />
          {t.live.modes[draft.mode]}
        </span>
        <span aria-live="polite" className="ml-auto label-mono text-xs text-muted">
          {saveLabel}
        </span>
        <button type="button" onClick={logout} className={`${CHIP} ${CHIP_OFF}`}>
          {t.logout}
        </button>
      </div>

      <div>
        <p className="m-0 label-mono text-xs font-extrabold text-bordeaux-hi">
          {t.kicker}
        </p>
        <h2 className="mt-2 mb-0 font-display text-5xl leading-[0.95] sm:text-6xl">
          {t.heading} <span className="text-tq">{t.headingAccent}</span>
        </h2>
      </div>

      {!storageReady ? (
        <p role="alert" className="m-0 label-mono text-xs font-extrabold text-live">
          {t.errors["storage-not-configured"]}
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-7">
          {/* Live status */}
          <Card title={t.live.title} hint={t.live.hint}>
            <div role="group" aria-label={t.live.title} className="flex flex-wrap gap-2">
              {MODES.map((mode) => {
                const on = draft.mode === mode;
                const onClass = mode === "live" ? "bg-live text-ink" : CHIP_ON;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ mode })}
                    className={`${CHIP} ${on ? onClass : CHIP_OFF}`}
                  >
                    {t.live.modes[mode]}
                  </button>
                );
              })}
            </div>
            <p className="m-0 text-[15px] leading-relaxed text-muted">
              {t.live.help[draft.mode]}
              {draft.mode === "auto" && !twitchReady
                ? " (TWITCH_CLIENT_ID/SECRET missing, so Auto stays offline.)"
                : ""}
            </p>
          </Card>

          {/* Today */}
          <Card title={t.today.title}>
            <label className="flex flex-col gap-2">
              <span className={LABEL}>{t.today.topic}</span>
              <input
                type="text"
                maxLength={TOPIC_MAX}
                value={draft.topic}
                placeholder={t.today.topicPlaceholder}
                onChange={(event) => update({ topic: event.target.value })}
                className={INPUT}
              />
            </label>
            <div className="flex flex-col gap-2">
              <span id="game-label" className={LABEL}>
                {t.today.game}
              </span>
              <div
                role="group"
                aria-labelledby="game-label"
                className="flex flex-wrap gap-2"
              >
                {GAME_CHIPS.map((game) => {
                  const on = !otherGame && draft.game === game;
                  return (
                    <button
                      key={game}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setOtherGame(false);
                        update({ game: on ? "" : game });
                      }}
                      className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
                    >
                      {game}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={otherGame}
                  onClick={() => {
                    setOtherGame(true);
                    update({ game: "" });
                  }}
                  className={`${CHIP} ${otherGame ? CHIP_ON : CHIP_OFF}`}
                >
                  {t.today.other}
                </button>
              </div>
              {otherGame ? (
                <input
                  type="text"
                  aria-label={t.today.otherPlaceholder}
                  maxLength={GAME_MAX}
                  value={draft.game}
                  placeholder={t.today.otherPlaceholder}
                  onChange={(event) => update({ game: event.target.value })}
                  className={INPUT}
                />
              ) : null}
            </div>
          </Card>

          {/* Countdown */}
          <Card title={t.countdown.title} hint={t.countdown.hint}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t.countdown.at}</span>
                <input
                  type="time"
                  value={toTimeValue(draft.countdown?.to)}
                  onChange={(event) => {
                    const now = Date.now();
                    const to = nextOccurrence(event.target.value, now);
                    update({ countdown: to ? { from: now, to } : null });
                  }}
                  className={INPUT}
                />
              </label>
              <div className="flex flex-col gap-2">
                <span className={LABEL}>{t.countdown.quick}</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_MINUTES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        const now = Date.now();
                        update({ countdown: { from: now, to: now + n * 60_000 } });
                      }}
                      className={`${CHIP} ${CHIP_OFF}`}
                    >
                      {interpolate(t.countdown.minutes, { n })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[15px] text-muted">
                {draft.countdown
                  ? interpolate(t.countdown.running, {
                      time: toTimeValue(draft.countdown.to),
                    })
                  : t.countdown.none}
              </p>
              {draft.countdown ? (
                <button
                  type="button"
                  onClick={() => update({ countdown: null })}
                  className={`${CHIP} ${CHIP_OFF}`}
                >
                  {t.countdown.clear}
                </button>
              ) : null}
            </div>
          </Card>

          {/* Next stream */}
          <Card title={t.next.title} hint={t.next.hint}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t.next.date}</span>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(event) => {
                    setNextDate(event.target.value);
                    updateNext(event.target.value, nextTime);
                  }}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t.next.time}</span>
                <input
                  type="time"
                  value={nextTime}
                  onChange={(event) => {
                    setNextTime(event.target.value);
                    updateNext(nextDate, event.target.value);
                  }}
                  className={INPUT}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <span className={LABEL}>{t.next.plan}</span>
              <input
                type="text"
                maxLength={PLAN_MAX}
                value={draft.next?.plan ?? ""}
                placeholder={t.next.planPlaceholder}
                disabled={!draft.next}
                onChange={(event) =>
                  updateNext(nextDate, nextTime, { plan: event.target.value })
                }
                className={`${INPUT} disabled:opacity-50`}
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3 text-base">
                <input
                  type="checkbox"
                  checked={draft.next?.show ?? true}
                  disabled={!draft.next}
                  onChange={(event) =>
                    updateNext(nextDate, nextTime, { show: event.target.checked })
                  }
                  className="size-5 accent-tq"
                />
                {t.next.show}
              </label>
              {draft.next ? (
                <button
                  type="button"
                  onClick={() => {
                    setNextDate("");
                    setNextTime("");
                    update({ next: null });
                  }}
                  className={`${CHIP} ${CHIP_OFF}`}
                >
                  {t.next.clear}
                </button>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={save}
              disabled={status.kind === "saving" || !storageReady}
              className={`${BUTTON_PRIMARY} disabled:opacity-60`}
            >
              {status.kind === "saving" ? t.saving : t.save}
            </button>
            {status.kind === "error" ? (
              <p role="alert" className="m-0 label-mono text-xs font-extrabold text-live">
                {status.message}
              </p>
            ) : null}
          </div>
        </div>

        {/* Where it shows */}
        <aside aria-labelledby="where-title" className={`${CARD} lg:sticky lg:top-28`}>
          <h2 id="where-title" className="m-0 font-display text-[26px] leading-none">
            {t.where.title}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {t.where.rows.map(([place, what]) => (
              <li
                key={place}
                className="flex justify-between gap-3 bg-ink px-3.5 py-3 text-[15px]"
              >
                <span>{place}</span>
                <b className="label-mono text-xs text-tq">{what}</b>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm leading-relaxed text-muted">{t.where.note}</p>
          <span className={LABEL}>{t.where.urls}</span>
          <code className="block bg-ink p-3 font-mono text-[13px] font-bold break-all text-tq">
            {`${siteConfig.url}/overlay/starting-soon.html`}
          </code>
        </aside>
      </div>
    </div>
  );
}

/** One section card: display title, optional mono hint on the right. */
function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="m-0 font-display text-[32px] leading-none">{title}</h3>
        {hint ? <span className={LABEL}>{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
