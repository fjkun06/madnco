/**
 * The admin form: what the panel edits, how it maps to the saved state, and
 * what is wrong with it. Pure, so every rule is unit-tested.
 */

import {
  parseClipUrl,
  type Preset,
  type Quest,
  type TickerScene,
} from "@/lib/stream/extras";
import {
  DEFAULT_STATE,
  type Countdown,
  type LiveMode,
  type StreamState,
} from "@/lib/stream/state";
import { en } from "@/locales/en";
import { dayOffset, fromDateTime, toDateValue, toTimeValue } from "./time";

export type AdminForm = {
  mode: LiveMode;
  topic: string;
  game: string;
  countdown: Countdown | null;
  /** "2026-11-21" or "" */
  nextDate: string;
  /** "20:00" or "" */
  nextTime: string;
  nextPlan: string;
  nextShow: boolean;
  brbMessage: string;
  brbUntil: number | null;
  /** Raw lines while editing; empty ones are dropped on save. */
  tickerItems: string[];
  tickerScenes: TickerScene[];
  quest: Quest;
  clipUrl: string;
  clipTitle: string;
  clipTag: string;
  clipShow: boolean;
  presets: Preset[];
};

/** The tabs of the panel; every field belongs to one. */
export type AdminTab = "live" | "schedule" | "screen" | "quest" | "web";
export const ADMIN_TABS: AdminTab[] = ["live", "schedule", "screen", "quest", "web"];

export type FormField = "nextDate" | "nextTime" | "clipUrl";
export type FormIssue = { field: FormField; tab: AdminTab; message: string };

/** The form for a saved state. */
export function toForm(state: StreamState): AdminForm {
  return {
    mode: state.mode,
    topic: state.topic,
    game: state.game,
    countdown: state.countdown,
    nextDate: toDateValue(state.next?.at),
    nextTime: toTimeValue(state.next?.at),
    nextPlan: state.next?.plan ?? "",
    nextShow: state.next?.show ?? true,
    brbMessage: state.brb.message,
    brbUntil: state.brb.until,
    tickerItems: state.ticker.items,
    tickerScenes: state.ticker.scenes,
    quest: state.quest,
    clipUrl: state.clip?.url ?? "",
    clipTitle: state.clip?.title ?? "",
    clipTag: state.clip?.tag ?? "",
    clipShow: state.clip?.show ?? true,
    presets: state.presets,
  };
}

/**
 * Every field empty, Live status back to Auto. Presets survive a reset:
 * they are tools, not stream info.
 */
export function emptyForm(current: AdminForm): AdminForm {
  return { ...toForm(DEFAULT_STATE), presets: current.presets };
}

/** @deprecated kept for tests and callers that have no current form. */
export const EMPTY_FORM: AdminForm = toForm(DEFAULT_STATE);

/**
 * The state to send. A next stream needs both a date and a time; a saved
 * one keeps its exact epoch when neither was touched. An unrecognised clip
 * link sends no clip (the form shows why).
 */
export function fromForm(form: AdminForm, saved: StreamState): StreamState {
  const savedForm = toForm(saved);
  const untouched =
    form.nextDate === savedForm.nextDate && form.nextTime === savedForm.nextTime;
  const at =
    untouched && saved.next ? saved.next.at : fromDateTime(form.nextDate, form.nextTime);
  const clip = parseClipUrl(form.clipUrl);
  return {
    mode: form.mode,
    topic: form.topic.trim(),
    game: form.game.trim(),
    countdown: form.countdown,
    next: at ? { at, plan: form.nextPlan.trim(), show: form.nextShow } : null,
    brb: { message: form.brbMessage.trim(), until: form.brbUntil },
    ticker: {
      items: form.tickerItems.map((item) => item.trim()).filter(Boolean),
      scenes: form.tickerScenes,
    },
    quest: form.quest,
    clip: clip
      ? {
          url: form.clipUrl.trim(),
          ...clip,
          title: form.clipTitle.trim(),
          tag: form.clipTag.trim(),
          show: form.clipShow,
        }
      : null,
    presets: form.presets,
    updatedAt: saved.updatedAt,
  };
}

/**
 * What blocks a save: half a date, a new next stream that is already over,
 * or a clip link that isn't a TikTok, YouTube or Twitch clip. A time that
 * was saved earlier may pass while the stream runs; it is only checked once
 * it changes.
 */
export function formIssues(
  form: AdminForm,
  saved: StreamState,
  now: number,
): FormIssue[] {
  const t = en.admin.issues;
  const issues: FormIssue[] = [];
  const next = (field: FormField, message: string) =>
    issues.push({ field, tab: "schedule", message });

  const { nextDate: date, nextTime: time } = form;
  if (date && !time) next("nextTime", t.needTime);
  else if (time && !date) next("nextDate", t.needDate);
  else if (!date && !time) {
    if (form.nextPlan.trim()) next("nextDate", t.needDate);
  } else {
    const at = fromDateTime(date, time);
    if (at === null) next("nextDate", t.needDate);
    else if (at !== saved.next?.at && at < now - 60_000) {
      if (dayOffset(at, now) < 0) next("nextDate", t.dayOver);
      else next("nextTime", t.timeOver);
    }
  }

  if (form.clipUrl.trim() && !parseClipUrl(form.clipUrl)) {
    issues.push({ field: "clipUrl", tab: "web", message: t.badClip });
  }
  return issues;
}

const streamPart = ({ onBrb, onStarting, hideWhenDone }: Quest) => ({
  onBrb,
  onStarting,
  hideWhenDone,
});
const cardPart = (quest: Quest) => ({
  followers: quest.followers,
  goal: quest.goal,
  title: quest.title,
  text: quest.text,
  doneText: quest.doneText,
  show: quest.show,
});

/** Which fields differ from the saved state, with the tab they live on. */
export function changedFields(
  form: AdminForm,
  saved: StreamState,
): { key: keyof AdminForm; tab: AdminTab }[] {
  const b = toForm(saved);
  const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
  const checks: [keyof AdminForm, AdminTab, unknown, unknown][] = [
    ["mode", "live", form.mode, b.mode],
    ["topic", "live", form.topic.trim(), b.topic],
    ["game", "live", form.game.trim(), b.game],
    ["countdown", "live", form.countdown?.to ?? null, b.countdown?.to ?? null],
    ["brbMessage", "live", form.brbMessage.trim(), b.brbMessage],
    ["brbUntil", "live", form.brbUntil, b.brbUntil],
    ["presets", "live", form.presets, b.presets],
    ["nextDate", "schedule", form.nextDate, b.nextDate],
    ["nextTime", "schedule", form.nextTime, b.nextTime],
    ["nextPlan", "schedule", form.nextPlan.trim(), b.nextPlan],
    ["nextShow", "schedule", form.nextShow, b.nextShow],
    [
      "tickerItems",
      "screen",
      form.tickerItems.map((item) => item.trim()).filter(Boolean),
      b.tickerItems,
    ],
    ["tickerScenes", "screen", form.tickerScenes, b.tickerScenes],
    // The on-stream toggles live on the On screen tab, the rest on Side quest.
    ["quest", "screen", streamPart(form.quest), streamPart(b.quest)],
    ["quest", "quest", cardPart(form.quest), cardPart(b.quest)],
    ["clipUrl", "web", form.clipUrl.trim(), b.clipUrl],
    ["clipTitle", "web", form.clipTitle.trim(), b.clipTitle],
    ["clipTag", "web", form.clipTag.trim(), b.clipTag],
    ["clipShow", "web", form.clipShow, b.clipShow],
  ];
  return checks.filter(([, , x, y]) => !same(x, y)).map(([key, tab]) => ({ key, tab }));
}

/** How many fields differ from the saved state. */
export function changedCount(form: AdminForm, saved: StreamState): number {
  return changedFields(form, saved).length;
}
