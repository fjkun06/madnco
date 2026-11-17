"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
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
import { interpolate, interpolateParts } from "@/utils/interpolate";
import { BUTTON_GHOST, BUTTON_PRIMARY } from "@/utils/ui.classes";
import { DatePicker } from "./DatePicker";
import { errorText } from "./errors";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "./fields";
import {
  EMPTY_FORM,
  changedCount,
  formIssues,
  fromForm,
  toForm,
  type AdminForm,
  type FormField,
} from "./form";
import {
  dayOffset,
  formatDuration,
  fromDateTime,
  nextOccurrence,
  relativeDay,
  toDateValue,
  toTimeValue,
} from "./time";
import { TimePicker } from "./TimePicker";
import { ToastStack, useToasts } from "./Toasts";
import { Toggle } from "./Toggle";
import { readNow, useNow } from "./useNow";

const MODES: LiveMode[] = ["auto", "live", "off"];
const QUICK_MINUTES = [5, 10, 15];
const RESET_CONFIRM_MS = 3000;

/**
 * A section card. The cut corners sit on a pseudo-element, not on the card,
 * so the pickers can open past the card's edge; a card with an open picker
 * rises above the cards after it.
 */
const CARD =
  "relative z-0 flex flex-col gap-4 p-5 sm:p-7 before:absolute before:inset-0 before:-z-10 before:bg-ink-2 before:cut has-[[aria-expanded=true]]:z-30";

const BUTTON_DANGER =
  "focus-inset label-mono inline-flex min-h-12 items-center justify-center px-4 text-[11px] font-extrabold whitespace-nowrap cut transition-colors duration-200 sm:min-h-14 sm:px-6 sm:text-[14px]";

const isOtherGame = (game: string) =>
  game !== "" && !(GAME_CHIPS as readonly string[]).includes(game);

/**
 * The control room. Edits stay local until "Save" (or Ctrl+S), which sends
 * the whole state; the server checks it again and the overlays pick it up
 * within seconds.
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
  const now = useNow();
  const [saved, setSaved] = useState<StreamState>(initial);
  const [form, setForm] = useState<AdminForm>(() => toForm(initial));
  const [otherGame, setOtherGame] = useState(isOtherGame(initial.game));
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);
  const { toasts, push, dismiss } = useToasts();

  const changes = changedCount(form, saved);
  const dirty = changes > 0;
  const issues = formIssues(form, saved, now);
  const issueFor = (field: FormField) =>
    issues.find((issue) => issue.field === field)?.message;

  function update(patch: Partial<AdminForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function load(state: StreamState) {
    setForm(toForm(state));
    setOtherGame(isOtherGame(state.game));
  }

  async function save() {
    if (saving || !storageReady) return;
    const problems = formIssues(form, saved, readNow());
    if (problems.length) {
      push("error", t.toasts.blockedTitle, `${t.next.title}: ${problems[0].message}.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fromForm(form, saved)),
      });
      const body = (await res.json().catch(() => ({}))) as StreamState & {
        error?: string;
      };
      if (!res.ok) {
        push("error", t.toasts.errorTitle, errorText(body.error));
        if (res.status === 401) router.refresh();
        return;
      }
      setSaved(body);
      load(body);
      setConfirmReset(false);
      push("ok", t.toasts.savedTitle, t.toasts.savedText);
    } catch {
      push("error", t.toasts.errorTitle, errorText());
    } finally {
      setSaving(false);
    }
  }

  function undo() {
    load(saved);
    setConfirmReset(false);
    push("warn", t.toasts.undoTitle, t.toasts.undoText);
  }

  function reset() {
    window.clearTimeout(resetTimer.current);
    if (!confirmReset) {
      setConfirmReset(true);
      resetTimer.current = window.setTimeout(
        () => setConfirmReset(false),
        RESET_CONFIRM_MS,
      );
      return;
    }
    setConfirmReset(false);
    setForm(EMPTY_FORM);
    setOtherGame(false);
    push("warn", t.toasts.resetTitle, t.toasts.resetText);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }

  // Ctrl+S / Cmd+S saves.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save();
    }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const live = form.mode === "live";
  const clock = now ? { h: new Date(now).getHours(), m: new Date(now).getMinutes() } : null;
  const today = now ? toDateValue(now) : "";

  // Countdown summary
  const cdTo = form.countdown?.to ?? null;
  const cdTomorrow = Boolean(cdTo && now && dayOffset(cdTo, now) >= 1);
  let cdLine: ReactNode = t.countdown.none;
  if (cdTo && now && cdTo > now) {
    cdLine = interpolateParts(t.countdown.running, {
      when: `${toTimeValue(cdTo)} ${relativeDay(cdTo, now)}`,
      left: formatDuration(cdTo - now),
    }).map((part, i) =>
      part.slot === "when" ? (
        <b key={i} className={cdTomorrow ? "text-bordeaux-hi" : "text-tq"}>
          {part.text}
        </b>
      ) : (
        <span key={i}>{part.text}</span>
      ),
    );
  } else if (cdTo && now) {
    cdLine = interpolate(t.countdown.ended, { time: toTimeValue(cdTo) });
  } else if (cdTo) {
    cdLine = toTimeValue(cdTo);
  }

  const nextAt = fromDateTime(form.nextDate, "12:00");
  const nextDateSub = nextAt && now ? relativeDay(nextAt, now) : undefined;
  const hasNext = Boolean(form.nextDate || form.nextTime || form.nextPlan);

  const changesLabel =
    changes === 0
      ? t.changes.none
      : changes === 1
        ? t.changes.one
        : interpolate(t.changes.other, { n: changes });

  return (
    <div className="flex flex-col gap-8">
      <ToastStack toasts={toasts} onClose={dismiss} />

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
            className={`size-2.5 rounded-full ${live ? "live-dot bg-ink" : "bg-off"}`}
          />
          {t.live.modes[form.mode]}
        </span>
        <button
          type="button"
          onClick={logout}
          className={`${CHIP} ${CHIP_OFF} ml-auto`}
        >
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
                const on = form.mode === mode;
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
              {t.live.help[form.mode]}
              {form.mode === "auto" && !twitchReady
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
                value={form.topic}
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
                  const on = !otherGame && form.game === game;
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
                    setOtherGame(!otherGame);
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
                  value={form.game}
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
              <TimePicker
                id="countdown-time"
                label={t.countdown.at}
                value={toTimeValue(cdTo)}
                sub={cdTo && now ? relativeDay(cdTo, now) : undefined}
                pastBefore={clock}
                onPick={(value) => {
                  const at = readNow();
                  const to = nextOccurrence(value, at);
                  update({ countdown: to ? { from: at, to } : null });
                }}
              />
              <div className="flex flex-col gap-2">
                <span className={LABEL}>{t.countdown.quick}</span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_MINUTES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        const at = readNow();
                        update({ countdown: { from: at, to: at + n * 60_000 } });
                      }}
                      className={`${CHIP} ${CHIP_OFF}`}
                    >
                      {interpolate(t.countdown.minutes, { n })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`flex flex-wrap items-center gap-3 border-l-4 bg-ink px-4 py-3 text-base ${
                cdTomorrow ? "border-bordeaux-hi" : cdTo ? "border-tq" : "border-ink-3"
              }`}
            >
              <p className="m-0 min-w-48 flex-1 text-paper">{cdLine}</p>
              {cdTo ? (
                <button
                  type="button"
                  onClick={() => update({ countdown: null })}
                  className={`${CHIP_SM} ${CHIP_OFF}`}
                >
                  {t.countdown.clear}
                </button>
              ) : null}
            </div>
            {cdTomorrow ? (
              <p className="m-0 text-sm text-bordeaux-hi">{t.countdown.tomorrowNote}</p>
            ) : null}
          </Card>

          {/* Next stream */}
          <Card title={t.next.title} hint={t.next.hint}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePicker
                id="next-date"
                label={t.next.date}
                value={form.nextDate}
                now={now}
                sub={nextDateSub}
                issue={issueFor("nextDate")}
                onPick={(nextDate) => update({ nextDate })}
              />
              <TimePicker
                id="next-time"
                label={t.next.time}
                value={form.nextTime}
                issue={issueFor("nextTime")}
                pastBefore={form.nextDate && form.nextDate === today ? clock : null}
                disablePast
                onPick={(nextTime) => update({ nextTime })}
              />
            </div>
            <label className="flex flex-col gap-2">
              <span className={LABEL}>{t.next.plan}</span>
              <input
                type="text"
                maxLength={PLAN_MAX}
                value={form.nextPlan}
                placeholder={t.next.planPlaceholder}
                onChange={(event) => update({ nextPlan: event.target.value })}
                className={INPUT}
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Toggle
                checked={form.nextShow}
                onChange={(nextShow) => update({ nextShow })}
              >
                {t.next.show}
              </Toggle>
              {hasNext ? (
                <button
                  type="button"
                  onClick={() =>
                    update({ nextDate: "", nextTime: "", nextPlan: "", nextShow: true })
                  }
                  className={`${CHIP} ${CHIP_OFF}`}
                >
                  {t.next.clear}
                </button>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Where it shows */}
        <aside
          aria-labelledby="where-title"
          className="flex flex-col gap-4 bg-ink-2 p-5 cut sm:p-7 lg:sticky lg:top-28"
        >
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

      {/* Action bar: sticks to the bottom of the screen, full width */}
      <div className="sticky bottom-0 z-20 bg-ink-2 py-4 shadow-[0_0_0_100vmax_var(--color-ink-2)] [clip-path:inset(-2px_-100vmax_0)]">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -top-0.5 h-0.5 bg-bordeaux-hi shadow-[0_0_0_100vmax_var(--color-bordeaux-hi)] [clip-path:inset(0_-100vmax)]"
        />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span
            aria-live="polite"
            className={`flex items-center gap-2.5 label-mono text-xs font-extrabold ${
              dirty ? "text-bordeaux-hi" : "text-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-2.5 rounded-full ${dirty ? "bg-bordeaux-hi" : "bg-off"}`}
            />
            {changesLabel}
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto sm:gap-3.5">
            <button
              type="button"
              onClick={save}
              disabled={saving || !storageReady}
              className={`${BUTTON_PRIMARY} disabled:opacity-60`}
            >
              {saving ? t.saving : t.save}
              <span className="hidden text-[11px] opacity-60 sm:inline">
                {t.shortcut}
              </span>
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={!dirty || saving}
              className={`${BUTTON_GHOST} disabled:pointer-events-none disabled:opacity-40`}
            >
              <span className="sm:hidden">{t.undoShort}</span>
              <span className="hidden sm:inline">{t.undo}</span>
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className={`${BUTTON_DANGER} ${
                confirmReset
                  ? "bg-live text-ink"
                  : "bg-transparent text-live shadow-[inset_0_0_0_2px_var(--color-live)] hover:bg-live hover:text-ink"
              }`}
            >
              {confirmReset ? (
                t.resetConfirm
              ) : (
                <>
                  <span className="sm:hidden">{t.resetShort}</span>
                  <span className="hidden sm:inline">{t.reset}</span>
                </>
              )}
            </button>
          </div>
        </div>
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
