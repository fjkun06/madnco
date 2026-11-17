/**
 * Dates and times for the admin panel, in the browser's own time zone (the
 * admin's). Values use the same strings as <input type="date|time">:
 * "2026-11-21" and "20:05".
 */

import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";

const pad = (n: number) => String(n).padStart(2, "0");
const DAY_MS = 24 * 60 * 60 * 1000;

/** "20:05" for an epoch, or "" for null. */
export function toTimeValue(ms: number | null | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-11-21" for an epoch, or "" for null. */
export function toDateValue(ms: number | null | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-21" for a year, month (0-11) and day. */
export function dateValue(year: number, month: number, day: number): string {
  return toDateValue(new Date(year, month, day).getTime());
}

/** Epoch for a date + time pair, or null while either is missing or invalid. */
export function fromDateTime(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;
  const at = new Date(y, m - 1, d, h, min);
  // Reject dates that roll over, like 31 Feb.
  if (at.getDate() !== d) return null;
  return at.getTime();
}

/**
 * The next time the clock shows `time`: today if still ahead, otherwise
 * tomorrow (a go-live time just after midnight).
 */
export function nextOccurrence(time: string, now: number): number | null {
  const today = fromDateTime(toDateValue(now), time);
  if (today === null) return null;
  if (today > now) return today;
  const d = new Date(now);
  return fromDateTime(dateValue(d.getFullYear(), d.getMonth(), d.getDate() + 1), time);
}

/** Calendar days from `now` to `ms`: 0 today, 1 tomorrow, -1 yesterday. */
export function dayOffset(ms: number, now: number): number {
  const a = new Date(ms);
  const b = new Date(now);
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da - db) / DAY_MS);
}

/** "today", "tomorrow", "in 4 days", "yesterday", "3 days ago". */
export function relativeDay(ms: number, now: number): string {
  const t = en.admin.when;
  const n = dayOffset(ms, now);
  if (n === 0) return t.today;
  if (n === 1) return t.tomorrow;
  if (n === -1) return t.yesterday;
  return n > 0 ? interpolate(t.inDays, { n }) : interpolate(t.daysAgo, { n: -n });
}

/** "Sat 21 Nov" for a date value, or "" when it is not a date. */
export function formatDay(date: string): string {
  const at = fromDateTime(date, "12:00");
  if (at === null) return "";
  const d = new Date(at);
  return `${en.admin.when.weekdays[d.getDay()]} ${d.getDate()} ${en.admin.when.months[d.getMonth()].slice(0, 3)}`;
}

/** "1 h 12 min", "45 min", "2 d 3 h", "under a minute". */
export function formatDuration(ms: number): string {
  const t = en.admin.when;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return t.underMinute;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return mins ? `${hours} h ${mins} min` : `${hours} h`;
  return `${mins} min`;
}

/** One cell of the month grid. */
export type DayCell = { value: string; day: number; inMonth: boolean };

/**
 * Six weeks starting on the Monday on or before the 1st, so every month
 * has the same height.
 */
export function monthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const shift = (first.getDay() + 6) % 7; // Monday = 0
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - shift + i);
    cells.push({
      value: toDateValue(d.getTime()),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

/** The next Saturday (6) or Sunday (0) from `now`, today included. */
export function nextWeekday(weekday: number, now: number): string {
  const d = new Date(now);
  const ahead = (weekday - d.getDay() + 7) % 7;
  return dateValue(d.getFullYear(), d.getMonth(), d.getDate() + ahead);
}
