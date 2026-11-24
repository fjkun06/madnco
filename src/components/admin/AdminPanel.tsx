"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { StreamState } from "@/lib/stream/state";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { useReduceMotion } from "@/components/ui/reveal/motion";
import { BUTTON_GHOST, BUTTON_PRIMARY } from "@/utils/ui.classes";
import { BackToTop } from "./BackToTop";
import { errorText } from "./errors";
import { CHIP, CHIP_OFF } from "./fields";
import {
  ADMIN_TABS,
  changedFields,
  emptyForm,
  formIssues,
  fromForm,
  toForm,
  type AdminForm,
  type AdminTab,
  type FormField,
} from "./form";
import { FansTab } from "./tabs/FansTab";
import { GamesTab } from "./tabs/GamesTab";
import { LiveTab, isOtherGame } from "./tabs/LiveTab";
import { QuestTab } from "./tabs/QuestTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { ScreenTab } from "./tabs/ScreenTab";
import { StreamLogTab } from "./tabs/StreamLogTab";
import type { TabProps } from "./tabs/shared";
import { WebTab } from "./tabs/WebTab";
import { ToastStack, useToasts } from "./Toasts";
import { readNow, useNow } from "./useNow";
import { WhereItShows } from "./WhereItShows";

const RESET_CONFIRM_MS = 3000;

const BUTTON_DANGER =
  "focus-inset label-mono inline-flex min-h-12 items-center justify-center px-4 text-[11px] font-extrabold whitespace-nowrap cut transition-colors duration-200 sm:min-h-14 sm:px-6 sm:text-[14px]";

/**
 * The control room. Five tabs edit one form; edits stay local until "Save"
 * (or Ctrl+S), which sends the whole state. The server checks it again and
 * the overlays pick it up within seconds. The Discord ping is the one thing
 * that acts right away.
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
  // Back from a Twitch / YouTube login (?connect=…): open the Fans tab.
  const connectResult = useSearchParams().get("connect");
  const [tab, setTab] = useState<AdminTab>(connectResult ? "fans" : "live");
  const reduceMotion = useReduceMotion();
  // Marks where the sub navbar sits before it sticks (see openTab).
  const navAnchor = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /**
   * Switch tabs and start the new one at its top: if the page is scrolled
   * past the sub navbar, jump (no smooth scroll) to where the navbar sticks,
   * so the new tab's first card sits right under it.
   */
  function openTab(key: AdminTab) {
    const anchor = navAnchor.current;
    const nav = navRef.current;
    if (anchor && nav) {
      const stickTop = parseFloat(getComputedStyle(nav).top) || 0;
      const target = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - stickTop);
      if (window.scrollY > target) window.scrollTo({ top: target, behavior: "instant" });
    }
    setTab(key);
  }
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);
  const { toasts, push, dismiss } = useToasts();

  const changes = changedFields(form, saved);
  const dirty = changes.length > 0;
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
      const first = problems[0];
      openTab(first.tab);
      push("error", t.toasts.blockedTitle, `${t.tabs[first.tab]}: ${first.message}.`);
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
        state?: StreamState;
      };
      if (res.status === 409 && body.error === "stale" && body.state) {
        // Changed from the Remote meanwhile: show the latest, nothing overwritten.
        setSaved(body.state);
        load(body.state);
        push("warn", t.toasts.staleTitle, t.toasts.staleText);
        return;
      }
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
    setForm(emptyForm(form));
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
  const changesLabel =
    changes.length === 0
      ? t.changes.none
      : changes.length === 1
        ? t.changes.one
        : interpolate(t.changes.other, { n: changes.length });

  const props: TabProps = { form, update, saved, now, push, issueFor };

  return (
    <div className="flex flex-col gap-6">
      <ToastStack toasts={toasts} onClose={dismiss} />
      <BackToTop className="bottom-28 sm:bottom-24" />

      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-4">
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
        <Link
          href="/admin/remote"
          className={`${CHIP} ml-auto inline-flex items-center bg-bordeaux-hi text-ink no-underline hover:bg-paper`}
        >
          {t.remoteLink}
        </Link>
        <button type="button" onClick={logout} className={`${CHIP} ${CHIP_OFF}`}>
          {t.logout}
        </button>
      </div>

      {/* Sub navbar: sticks under the site header */}
      <div ref={navAnchor} aria-hidden="true" />
      <nav
        ref={navRef}
        aria-label={t.tabs.label}
        className="sticky top-16 z-20 -mx-4 overflow-x-auto bg-ink px-4 sm:top-[72px] sm:mx-0 sm:px-0 md:top-[84px]"
      >
        <ul role="tablist" className="m-0 flex list-none gap-1 border-b-2 border-ink-3 p-0">
          {ADMIN_TABS.map((key) => {
            const active = tab === key;
            const changed = changes.some((change) => change.tab === key);
            const broken = issues.some((issue) => issue.tab === key);
            return (
              <li key={key} role="presentation">
                <button
                  type="button"
                  role="tab"
                  id={`tab-${key}`}
                  aria-selected={active}
                  aria-controls="admin-tabpanel"
                  onClick={() => openTab(key)}
                  className={`focus-inset relative flex items-center gap-2.5 px-4 py-4 label-mono text-[12px] font-extrabold whitespace-nowrap transition-colors duration-200 sm:px-5 sm:text-[13px] ${
                    active ? "text-paper" : "text-muted hover:text-paper"
                  }`}
                >
                  {t.tabs[key]}
                  {broken ? (
                    <span className="size-2 rounded-full bg-live">
                      <span className="sr-only">({t.tabs.issue})</span>
                    </span>
                  ) : changed ? (
                    <span className="size-2 rounded-full bg-bordeaux-hi">
                      <span className="sr-only">({t.tabs.unsaved})</span>
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-0.5 h-1 bg-tq transition-transform duration-200 ease-smooth ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!storageReady ? (
        <p role="alert" className="m-0 label-mono text-xs font-extrabold text-live">
          {t.errors["storage-not-configured"]}
        </p>
      ) : null}

      {/* The stream log gets the full width (charts); the other tabs share it with "Where it shows". */}
      <div
        className={`grid grid-cols-1 items-start gap-7 ${
          tab === "log" ? "" : "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        }`}
      >
        <m.div
          key={tab}
          id="admin-tabpanel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "live" ? (
            <LiveTab
              {...props}
              otherGame={otherGame}
              setOtherGame={setOtherGame}
              twitchReady={twitchReady}
            />
          ) : null}
          {tab === "games" ? <GamesTab {...props} /> : null}
          {tab === "fans" ? <FansTab {...props} /> : null}
          {tab === "schedule" ? <ScheduleTab {...props} /> : null}
          {tab === "screen" ? <ScreenTab {...props} /> : null}
          {tab === "quest" ? <QuestTab {...props} /> : null}
          {tab === "log" ? <StreamLogTab {...props} /> : null}
          {tab === "web" ? <WebTab {...props} /> : null}
        </m.div>
        {tab === "log" ? null : <WhereItShows onToast={push} />}
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
              <span className="hidden text-[11px] opacity-60 sm:inline">{t.shortcut}</span>
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
