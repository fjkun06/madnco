/**
 * The admin form: what the panel edits, how it maps to the saved state, and
 * what is wrong with it. Pure, so every rule is unit-tested.
 */

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
};

export type FormField = "nextDate" | "nextTime";
export type FormIssue = { field: FormField; message: string };

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
  };
}

/** Every field empty, Live status back to Auto. */
export const EMPTY_FORM: AdminForm = toForm(DEFAULT_STATE);

/**
 * The state to send. A next stream needs both a date and a time; a saved
 * one keeps its exact epoch when neither was touched.
 */
export function fromForm(form: AdminForm, saved: StreamState): StreamState {
  const savedForm = toForm(saved);
  const untouched =
    form.nextDate === savedForm.nextDate && form.nextTime === savedForm.nextTime;
  const at =
    untouched && saved.next
      ? saved.next.at
      : fromDateTime(form.nextDate, form.nextTime);
  return {
    mode: form.mode,
    topic: form.topic.trim(),
    game: form.game.trim(),
    countdown: form.countdown,
    next: at ? { at, plan: form.nextPlan.trim(), show: form.nextShow } : null,
    updatedAt: saved.updatedAt,
  };
}

/**
 * What blocks a save: half a date, or a new next stream that is already
 * over. A time that was saved earlier may pass while the stream runs; it
 * is only checked once it changes.
 */
export function formIssues(form: AdminForm, saved: StreamState, now: number): FormIssue[] {
  const t = en.admin.issues;
  const { nextDate: date, nextTime: time } = form;
  if (date && !time) return [{ field: "nextTime", message: t.needTime }];
  if (time && !date) return [{ field: "nextDate", message: t.needDate }];
  if (!date && !time) {
    return form.nextPlan.trim() ? [{ field: "nextDate", message: t.needDate }] : [];
  }
  const at = fromDateTime(date, time);
  if (at === null) return [{ field: "nextDate", message: t.needDate }];
  if (at === saved.next?.at || at >= now - 60_000) return [];
  return dayOffset(at, now) < 0
    ? [{ field: "nextDate", message: t.dayOver }]
    : [{ field: "nextTime", message: t.timeOver }];
}

/** How many fields differ from the saved state. */
export function changedCount(form: AdminForm, saved: StreamState): number {
  const b = toForm(saved);
  const pairs: [unknown, unknown][] = [
    [form.mode, b.mode],
    [form.topic.trim(), b.topic],
    [form.game.trim(), b.game],
    [form.countdown?.to ?? null, b.countdown?.to ?? null],
    [form.nextDate, b.nextDate],
    [form.nextTime, b.nextTime],
    [form.nextPlan.trim(), b.nextPlan],
    [form.nextShow, b.nextShow],
  ];
  return pairs.filter(([x, y]) => x !== y).length;
}
