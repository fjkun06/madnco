/**
 * Stream log: one entry per stream (date, start–end, game, per-platform
 * numbers from each platform's stream summary), browsed by week / month /
 * year in the Control Room. Pure functions only; Redis lives in
 * streamLogStore.ts.
 */

export const LOG_PLATFORMS = ["twitch", "youtube", "tiktok"] as const;
export type LogPlatform = (typeof LOG_PLATFORMS)[number];

/** Numbers from one platform's stream summary; `null` = not filled in. */
export const PLATFORM_FIELDS = ["peak", "avg", "unique", "comments", "newFollowers", "followers"] as const;
export type PlatformField = (typeof PLATFORM_FIELDS)[number];
export type PlatformStats = Record<PlatformField, number | null>;

export const GOAL_RESULTS = ["reached", "partly", "missed", "none"] as const;
export type GoalResult = (typeof GOAL_RESULTS)[number];

export type StreamLogEntry = {
  id: string;
  /** YYYY-MM-DD (the day the stream started). */
  date: string;
  /** HH:MM, 24 h. The end may be after midnight (end earlier than start). */
  start: string;
  end: string;
  game: string;
  part: number | null;
  co: string;
  platforms: Record<LogPlatform, PlatformStats>;
  /** Deaths or the game's main counter at the end of the stream. */
  counter: number | null;
  clips: number | null;
  raids: number | null;
  goal: GoalResult;
  /** How the stream felt, 1–5. */
  rating: number | null;
  notes: string;
  updatedAt: number;
};

export const LOG_TEXT_MAX = 60;
export const LOG_NOTES_MAX = 600;
export const LOG_NUMBER_MAX = 10_000_000;
export const LOG_MAX_ENTRIES = 3000;

const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const EMPTY_PLATFORM: PlatformStats = {
  peak: null,
  avg: null,
  unique: null,
  comments: null,
  newFollowers: null,
  followers: null,
};

export function emptyEntry(date: string): StreamLogEntry {
  return {
    id: "",
    date,
    start: "",
    end: "",
    game: "",
    part: null,
    co: "",
    platforms: { twitch: { ...EMPTY_PLATFORM }, youtube: { ...EMPTY_PLATFORM }, tiktok: { ...EMPTY_PLATFORM } },
    counter: null,
    clips: null,
    raids: null,
    goal: "none",
    rating: null,
    notes: "",
    updatedAt: 0,
  };
}

/** Stream length in minutes; an end before the start means past midnight. */
export function durationMinutes(start: string, end: string): number | null {
  if (!TIME.test(start) || !TIME.test(end)) return null;
  const a = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
  const b = Number(end.slice(0, 2)) * 60 + Number(end.slice(3));
  const diff = b - a;
  if (diff === 0) return null;
  return diff > 0 ? diff : diff + 24 * 60;
}

/** "2 h 35 min", "45 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const toNumber = (value: unknown, decimals = 0): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  const f = 10 ** decimals;
  return Math.min(LOG_NUMBER_MAX, Math.round(n * f) / f);
};

const toText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function sanitizePlatform(input: unknown): PlatformStats {
  const r = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  return {
    peak: toNumber(r.peak),
    avg: toNumber(r.avg, 1),
    unique: toNumber(r.unique),
    comments: toNumber(r.comments),
    newFollowers: toNumber(r.newFollowers),
    followers: toNumber(r.followers),
  };
}

export function isLogId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{6,24}$/.test(value);
}

export function newLogId(now: number): string {
  return `${now.toString(36)}${Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .padStart(4, "0")}`;
}

/** A clean entry, or `null` when the date or the times are missing or invalid. */
export function sanitizeLogEntry(input: unknown, now: number): StreamLogEntry | null {
  if (typeof input !== "object" || input === null) return null;
  const r = input as Record<string, unknown>;
  const date = typeof r.date === "string" && DATE.test(r.date) ? r.date : null;
  const start = typeof r.start === "string" && TIME.test(r.start) ? r.start : null;
  const end = typeof r.end === "string" && TIME.test(r.end) ? r.end : null;
  if (!date || !start || !end || durationMinutes(start, end) === null) return null;
  const p = (typeof r.platforms === "object" && r.platforms !== null ? r.platforms : {}) as Record<string, unknown>;
  const rating = toNumber(r.rating);
  return {
    id: isLogId(r.id) ? r.id : newLogId(now),
    date,
    start,
    end,
    game: toText(r.game, LOG_TEXT_MAX),
    part: toNumber(r.part),
    co: toText(r.co, LOG_TEXT_MAX),
    platforms: {
      twitch: sanitizePlatform(p.twitch),
      youtube: sanitizePlatform(p.youtube),
      tiktok: sanitizePlatform(p.tiktok),
    },
    counter: toNumber(r.counter),
    clips: toNumber(r.clips),
    raids: toNumber(r.raids),
    goal: (GOAL_RESULTS as readonly string[]).includes(r.goal as string) ? (r.goal as GoalResult) : "none",
    rating: rating !== null && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    notes: toText(r.notes, LOG_NOTES_MAX),
    updatedAt: now,
  };
}

/** Oldest first (date, then start time). */
export function sortEntries(entries: StreamLogEntry[]): StreamLogEntry[] {
  return [...entries].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

// ---------- periods ----------

export type Period = "week" | "month" | "year";
export const PERIODS: Period[] = ["week", "month", "year"];

const pad = (n: number) => String(n).padStart(2, "0");
/** Date parts → YYYY-MM-DD; rolls over like Date (day 0 = last day of previous month). */
export function ymd(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
const parts = (date: string) => date.split("-").map(Number) as [number, number, number];
/** 0 = Monday … 6 = Sunday. */
const weekday = (date: string) => {
  const [y, m, d] = parts(date);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};
export const addDays = (date: string, days: number) => {
  const [y, m, d] = parts(date);
  return ymd(y, m, d + days);
};

/** ISO week number (weeks start on Monday). */
export function isoWeek(date: string): number {
  const thursday = addDays(date, 3 - weekday(date));
  const [y] = parts(thursday);
  const firstThursday = addDays(`${y}-01-04`, 3 - weekday(`${y}-01-04`));
  const days = Math.round(
    (Date.UTC(...toUTC(thursday)) - Date.UTC(...toUTC(firstThursday))) / 86_400_000,
  );
  return 1 + days / 7;
}
const toUTC = (date: string): [number, number, number] => {
  const [y, m, d] = parts(date);
  return [y, m - 1, d];
};

export type Range = { from: string; to: string };

/** The week (Mon–Sun), month or year containing `anchor`. */
export function periodRange(period: Period, anchor: string): Range {
  const [y, m] = parts(anchor);
  if (period === "week") {
    const from = addDays(anchor, -weekday(anchor));
    return { from, to: addDays(from, 6) };
  }
  if (period === "month") return { from: ymd(y, m, 1), to: ymd(y, m + 1, 0) };
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

/** Move the anchor one period back (-1) or forward (+1). */
export function shiftAnchor(period: Period, anchor: string, delta: number): string {
  const [y, m, d] = parts(anchor);
  if (period === "week") return addDays(anchor, 7 * delta);
  if (period === "month") {
    const last = Number(ymd(y, m + delta + 1, 0).slice(8));
    return ymd(y, m + delta, Math.min(d, last));
  }
  return ymd(y + delta, m, Math.min(d, Number(ymd(y + delta, m + 1, 0).slice(8))));
}

export const inRange = (date: string, range: Range) => date >= range.from && date <= range.to;

export type Bucket = { key: string; label: string; from: string; to: string };

/** Chart columns: days of the week, days of the month, months of the year. */
export function dayBuckets(period: Period, range: Range, monthNames: readonly string[], dayNames: readonly string[]): Bucket[] {
  const out: Bucket[] = [];
  if (period === "year") {
    const [y] = parts(range.from);
    for (let m = 1; m <= 12; m++) {
      out.push({ key: `${y}-${pad(m)}`, label: monthNames[m - 1].slice(0, 3), from: ymd(y, m, 1), to: ymd(y, m + 1, 0) });
    }
    return out;
  }
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) {
    const label = period === "week" ? dayNames[weekday(day)] : String(Number(day.slice(8)));
    out.push({ key: day, label, from: day, to: day });
  }
  return out;
}

/** Columns for "hours live": days (week), ISO weeks (month), months (year). */
export function hourBuckets(period: Period, range: Range, monthNames: readonly string[], dayNames: readonly string[]): Bucket[] {
  if (period !== "month") return dayBuckets(period, range, monthNames, dayNames);
  const out: Bucket[] = [];
  let from = range.from;
  while (from <= range.to) {
    const sunday = addDays(from, 6 - weekday(from));
    const to = sunday < range.to ? sunday : range.to;
    out.push({ key: from, label: `Wk ${isoWeek(from)}`, from, to });
    from = addDays(to, 1);
  }
  return out;
}

// ---------- numbers ----------

const sum = (values: (number | null)[]) => values.reduce<number>((a, v) => a + (v ?? 0), 0);
const anyValue = (values: (number | null)[]) => values.some((v) => v !== null);

/** All platforms' value of one field for a stream; `null` when none filled in. */
export function entryTotal(entry: StreamLogEntry, field: PlatformField): number | null {
  const values = LOG_PLATFORMS.map((p) => entry.platforms[p][field]);
  return anyValue(values) ? sum(values) : null;
}

export function entryMinutes(entry: StreamLogEntry): number {
  return durationMinutes(entry.start, entry.end) ?? 0;
}

export type Totals = {
  streams: number;
  minutes: number;
  newFollowers: number;
  /** Mean over streams that have viewer numbers, of all platforms' average viewers added up. */
  avgViewers: number | null;
  comments: number;
  /** New followers per hour live. */
  followersPerHour: number | null;
  best: { id: string; date: string; value: number } | null;
  unique: Record<LogPlatform, number>;
};

export function totals(entries: StreamLogEntry[]): Totals {
  const minutes = sum(entries.map(entryMinutes));
  const newFollowers = sum(entries.map((e) => entryTotal(e, "newFollowers")));
  const avgs = entries.map((e) => entryTotal(e, "avg")).filter((v): v is number => v !== null);
  let best: Totals["best"] = null;
  for (const e of entries) {
    const f = entryTotal(e, "newFollowers");
    const m = entryMinutes(e);
    if (f === null || m < 15) continue;
    const value = Math.round((f / (m / 60)) * 10) / 10;
    if (!best || value > best.value) best = { id: e.id, date: e.date, value };
  }
  return {
    streams: entries.length,
    minutes,
    newFollowers,
    avgViewers: avgs.length ? Math.round((sum(avgs) / avgs.length) * 10) / 10 : null,
    comments: sum(entries.map((e) => entryTotal(e, "comments"))),
    followersPerHour: minutes >= 15 ? Math.round((newFollowers / (minutes / 60)) * 10) / 10 : null,
    best,
    unique: {
      twitch: sum(entries.map((e) => e.platforms.twitch.unique)),
      youtube: sum(entries.map((e) => e.platforms.youtube.unique)),
      tiktok: sum(entries.map((e) => e.platforms.tiktok.unique)),
    },
  };
}

/** New followers per bucket and platform (stacked bars). */
export function followersByBucket(entries: StreamLogEntry[], buckets: Bucket[]) {
  return buckets.map((b) => {
    const inside = entries.filter((e) => inRange(e.date, b));
    const values = Object.fromEntries(
      LOG_PLATFORMS.map((p) => [p, sum(inside.map((e) => e.platforms[p].newFollowers))]),
    ) as Record<LogPlatform, number>;
    return { bucket: b, values, streams: inside.length };
  });
}

/** Hours live per bucket. */
export function hoursByBucket(entries: StreamLogEntry[], buckets: Bucket[]) {
  return buckets.map((b) => ({
    bucket: b,
    hours: Math.round((sum(entries.filter((e) => inRange(e.date, b)).map(entryMinutes)) / 60) * 10) / 10,
  }));
}

/** Entries inside a range, oldest first. */
export function entriesIn(entries: StreamLogEntry[], range: Range): StreamLogEntry[] {
  return sortEntries(entries.filter((e) => inRange(e.date, range)));
}
