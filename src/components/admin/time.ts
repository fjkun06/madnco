/**
 * Converting between <input type="time|date"> values and epoch milliseconds,
 * in the browser's own time zone (the admin's).
 */

const pad = (n: number) => String(n).padStart(2, "0");

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

/** Epoch for a date + time pair, or null while either is missing or invalid. */
export function fromDateTime(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const ms = new Date(y, m - 1, d, h, min).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * The next time the clock shows `time`: today if still ahead, otherwise
 * tomorrow (a go-live time just after midnight).
 */
export function nextOccurrence(time: string, now: number): number | null {
  const today = fromDateTime(toDateValue(now), time);
  if (today === null) return null;
  return today > now ? today : today + 24 * 60 * 60 * 1000;
}
