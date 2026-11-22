/**
 * Game modes: one profile per game (name, mood, counters …) and the "live"
 * values that change during a stream (part, counters, scoreboard, hours).
 *
 * Profiles are saved with the rest of the control room form. Live values are
 * kept apart, in one Redis hash per game, so a Stream Deck key press can
 * count a death without the admin form overwriting it on the next save.
 *
 * Pure functions only, so every rule here is unit-tested.
 */

import { cleanText, isTime } from "./extras";

// ---------------------------------------------------------------- types

export const MOODS = ["football", "horror", "action", "story", "retro"] as const;
export type Mood = (typeof MOODS)[number];

/** What the stats box on the overlay shows. */
export const WIDGETS = ["counters", "football", "poll", "none"] as const;
export type Widget = (typeof WIDGETS)[number];

/** A counter on the overlay: its label and an optional total ("4 / 16"). */
export type CounterDef = { label: string; total: number | null };

/** A "Chat decides" poll. Votes are counted by the overlays from Twitch chat. */
export type Poll = {
  question: string;
  options: string[];
  open: boolean;
  /** When it was opened (epoch ms): a new value resets the votes. */
  openedAt: number | null;
};

/** Corner of the title card on the gaming overlay. */
export const CARD_POSITIONS = ["tl", "tr", "bl", "br"] as const;
export type CardPos = (typeof CARD_POSITIONS)[number];

/** Parts of the overlay that can be switched off per game. */
export const SHOW_FIELDS = ["showTitle", "showPart", "showGoal", "showRecord", "showGoals"] as const;
export type ShowField = (typeof SHOW_FIELDS)[number];

export type GameProfile = {
  /** Stable key: a slug of the first name. */
  id: string;
  name: string;
  mood: Mood;
  /** "Part", "Ep", "Session" … */
  unit: string;
  /** The game-name card. */
  showTitle: boolean;
  /** The part / session chip. */
  showPart: boolean;
  /** One line under the title. */
  goal: string;
  showGoal: boolean;
  /** Scoreboard: wins / draws / losses, and goals scored : conceded. */
  showRecord: boolean;
  showGoals: boolean;
  /** Preferred corner; the overlay moves it if the cam or logo is there. */
  cardPos: CardPos;
  /** "Previously on …" line for Starting Soon. */
  previously: string;
  widget: Widget;
  counters: CounterDef[];
  poll: Poll;
  /** Extra ticker lines while this game is on. */
  ticker: string[];
  /** Shows a FINAL PART badge. */
  finalPart: boolean;
  /** Set when the series is finished (epoch ms). */
  completedAt: number | null;
  /** Share-link preview images made from Frank's own screenshot, or `null`. */
  art: ShareArt | null;
};

/**
 * One JPEG per share link: live on TikTok / Twitch / YouTube, and offline.
 * Made in the browser from a gameplay screenshot, stored on Vercel Blob.
 */
export const SHARE_ART_KEYS = ["tiktok", "twitch", "youtube", "off"] as const;
export type ShareArtKey = (typeof SHARE_ART_KEYS)[number];
export type ShareArt = Record<ShareArtKey, string>;

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[A-Za-z0-9._~/-]{1,200}$/;

/** `true` for a public Vercel Blob URL (the only place share images live). */
export function isBlobUrl(value: unknown): value is string {
  return typeof value === "string" && BLOB_URL.test(value);
}

/** All four images as Blob URLs, or `null`. */
export function sanitizeArt(input: unknown): ShareArt | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;
  const out = {} as ShareArt;
  for (const key of SHARE_ART_KEYS) {
    if (!isBlobUrl(record[key])) return null;
    out[key] = record[key];
  }
  return out;
}

/**
 * The library plus which game is on stream. `known` = default games the
 * library has already had, so a new default (EA FC 27) gets added once and a
 * deleted one doesn't come back.
 */
export type Games = { list: GameProfile[]; current: string | null; known: string[] };

/** Values that change while streaming (one Redis hash per game). */
export type GameLive = {
  part: number;
  c1: number;
  c2: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  /** Minutes played. */
  mins: number;
};

export const LIVE_FIELDS = ["part", "c1", "c2", "w", "d", "l", "gf", "ga", "mins"] as const;
export type LiveField = (typeof LIVE_FIELDS)[number];

export const EMPTY_LIVE: GameLive = { part: 1, c1: 0, c2: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, mins: 0 };

/** Mood colours: accent, second accent (same as the overlays). */
export const MOOD_COLORS: Record<Mood, { a: string; b: string }> = {
  football: { a: "#30D5C8", b: "#E8557A" },
  horror: { a: "#E0213A", b: "#E7DFD1" },
  action: { a: "#FFB23E", b: "#8C96A3" },
  story: { a: "#E8C26A", b: "#E8557A" },
  retro: { a: "#B48CFF", b: "#30D5C8" },
};

// ---------------------------------------------------------------- limits

export const GAMES_MAX = 40;
export const GAME_NAME_MAX = 40;
export const UNIT_MAX = 12;
export const GOAL_LINE_MAX = 80;
export const PREVIOUSLY_MAX = 120;
export const COUNTER_LABEL_MAX = 20;
export const COUNTERS_MAX = 2;
export const COUNTER_TOTAL_MAX = 9999;
export const POLL_QUESTION_MAX = 80;
export const POLL_OPTION_MAX = 24;
export const POLL_OPTIONS_MAX = 4;
export const GAME_TICKER_MAX = 4;
export const GAME_TICKER_ITEM_MAX = 80;
export const LIVE_VALUE_MAX = 99_999;

/** One-tap counter labels in the control room. */
export const COUNTER_PRESETS = [
  "Deaths",
  "Bosses beaten",
  "Jump scares",
  "Rage quits",
  "Co's mistakes",
  "Missions",
  "Wins",
  "Losses",
] as const;

// ---------------------------------------------------------------- helpers

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** "Call of Duty: Black Ops 6" → "call-of-duty-black-ops-6". */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "game"
  );
}

/** A slug that isn't taken yet: "name", "name-2", "name-3" … */
export function uniqueId(name: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(name);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const isId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9-]{1,56}$/.test(value);

const EMPTY_POLL: Poll = { question: "", options: ["", ""], open: false, openedAt: null };

// ---------------------------------------------------------------- defaults

type Seed = [name: string, mood: Mood, unit: string, goal: string, widget: Widget, counters: string[], totals?: (number | null)[]];

/** Every game installed on Frank's PC (19 Nov 2026), with a sensible start. */
const SEEDS: Seed[] = [
  ["ROB RUN", "action", "Part", "Newbie vs ROB RUN: how many heists before I get busted?", "counters", ["Heists", "Busted"]],
  ["EA FC 27", "football", "Session", "Road to Division 1", "football", []],
  ["EA FC 26", "football", "Session", "Road to Division 1", "football", []],
  ["EA FC 25", "football", "Session", "Old squad, new grudges", "football", []],
  ["eFootball", "football", "Session", "Mad vs Co, first to 3 wins", "football", []],
  ["PES 6", "retro", "Special", "PES 6 vs FC 26: which is better?", "football", []],
  ["Resident Evil 7", "horror", "Part", "Get out of the main house", "counters", ["Jump scares", "Deaths"]],
  ["Resident Evil Village", "horror", "Part", "Find Rose", "counters", ["Jump scares", "Deaths"]],
  ["S.T.A.L.K.E.R. 2", "horror", "Part", "Survive the Zone", "counters", ["Deaths", "Anomalies hit"]],
  ["Gears of War: E-Day", "action", "Act", "Insane, no deaths challenge", "counters", ["Deaths", "Checkpoint"]],
  ["Call of Duty: Black Ops 6", "action", "Part", "Campaign on Veteran", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Black Ops Cold War", "action", "Part", "Campaign on Veteran", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Black Ops III", "action", "Part", "Campaign run", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Modern Warfare 4", "action", "Part", "Campaign run", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Modern Warfare II", "action", "Part", "Campaign on Veteran", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Modern Warfare III", "action", "Part", "Campaign run", "counters", ["Deaths", "Missions"]],
  ["Call of Duty: Vanguard", "action", "Part", "Campaign run", "counters", ["Deaths", "Missions"]],
  ["Battlefield 1", "action", "Part", "Every war story, no skips", "counters", ["Deaths", "War stories"]],
  ["Battlefield 4", "action", "Part", "Campaign run", "counters", ["Deaths", "Missions"]],
  ["Battlefield V", "action", "Part", "War stories run", "counters", ["Deaths", "War stories"]],
  ["Space Marine 2", "action", "Part", "For the Emperor, on hard", "counters", ["Deaths", "Missions"]],
  ["Dragon Ball Sparking! ZERO", "action", "Round", "Mad vs Co, best of 10", "counters", ["Mad wins", "Co wins"]],
  ["Forza Horizon 5", "action", "Session", "Rate the crash", "counters", ["Crashes", "Races won"]],
  ["Clair Obscur: Expedition 33", "story", "Ep", "Chat decides the big choices", "poll", []],
  ["Cyberpunk 2077", "story", "Ep", "Chat decides every choice", "poll", []],
  ["Red Dead Redemption 2", "story", "Ep", "Honourable outlaw run", "counters", ["Deaths", "Bounties"]],
  ["God of War", "story", "Ep", "First playthrough", "counters", ["Deaths", "Bosses beaten"]],
  ["God of War Ragnarök", "story", "Ep", "First playthrough", "counters", ["Deaths", "Bosses beaten"]],
  ["Final Fantasy XVI", "story", "Ep", "First playthrough", "counters", ["Deaths", "Bosses beaten"]],
  ["Control Resonant", "story", "Ep", "First playthrough", "counters", ["Deaths", "Bosses beaten"]],
];

/** Football games keep the top-left corner free for the in-game scoreboard. */
export const defaultCardPos = (mood: Mood): CardPos => (mood === "football" ? "bl" : "tl");

export function newProfile(name: string, taken: Iterable<string>, mood: Mood = "action"): GameProfile {
  return {
    id: uniqueId(name, taken),
    name: cleanText(name, GAME_NAME_MAX),
    mood,
    unit: "Part",
    showTitle: true,
    showPart: true,
    goal: "",
    showGoal: true,
    showRecord: true,
    showGoals: true,
    cardPos: defaultCardPos(mood),
    previously: "",
    widget: "counters",
    counters: [{ label: "Deaths", total: null }],
    poll: EMPTY_POLL,
    ticker: [],
    finalPart: false,
    completedAt: null,
    art: null,
  };
}

/** The starting library: every installed game. */
export const DEFAULT_LIBRARY: GameProfile[] = SEEDS.reduce<GameProfile[]>((list, seed) => {
  const [name, mood, unit, goal, widget, counters, totals] = seed;
  const profile = newProfile(name, list.map((g) => g.id), mood);
  list.push({
    ...profile,
    unit,
    goal,
    widget,
    counters: counters.map((label, i) => ({ label, total: totals?.[i] ?? null })),
  });
  return list;
}, []);

export const DEFAULT_IDS = DEFAULT_LIBRARY.map((g) => g.id);

/** Defaults added after the first library (v4); older saves get these once. */
const ADDED_LATER = ["ea-fc-27", "rob-run"];

export const DEFAULT_GAMES: Games = { list: DEFAULT_LIBRARY, current: null, known: DEFAULT_IDS };

// ---------------------------------------------------------------- sanitize

function sanitizeCounters(input: unknown): CounterDef[] {
  if (!Array.isArray(input)) return [];
  const out: CounterDef[] = [];
  for (const raw of input) {
    if (!isObject(raw)) continue;
    const label = cleanText(raw.label, COUNTER_LABEL_MAX);
    if (!label) continue;
    const total =
      typeof raw.total === "number" && Number.isFinite(raw.total) && raw.total >= 1
        ? Math.min(COUNTER_TOTAL_MAX, Math.round(raw.total))
        : null;
    out.push({ label, total });
    if (out.length === COUNTERS_MAX) break;
  }
  return out;
}

function sanitizePoll(input: unknown): Poll {
  if (!isObject(input)) return EMPTY_POLL;
  const options = Array.isArray(input.options)
    ? input.options.slice(0, POLL_OPTIONS_MAX).map((o) => cleanText(o, POLL_OPTION_MAX))
    : [];
  while (options.length < 2) options.push("");
  return {
    question: cleanText(input.question, POLL_QUESTION_MAX),
    options,
    open: input.open === true,
    openedAt: isTime(input.openedAt) ? input.openedAt : null,
  };
}

export function sanitizeProfile(input: unknown, taken: Set<string>): GameProfile | null {
  if (!isObject(input)) return null;
  const name = cleanText(input.name, GAME_NAME_MAX);
  if (!name) return null;
  const id = isId(input.id) && !taken.has(input.id) ? input.id : uniqueId(name, taken);
  const mood = MOODS.includes(input.mood as Mood) ? (input.mood as Mood) : "action";
  const widget = WIDGETS.includes(input.widget as Widget) ? (input.widget as Widget) : "counters";
  return {
    id,
    name,
    mood,
    unit: cleanText(input.unit, UNIT_MAX) || "Part",
    showTitle: input.showTitle !== false,
    showPart: input.showPart !== false,
    goal: cleanText(input.goal, GOAL_LINE_MAX),
    showGoal: input.showGoal !== false,
    showRecord: input.showRecord !== false,
    showGoals: input.showGoals !== false,
    cardPos: CARD_POSITIONS.includes(input.cardPos as CardPos)
      ? (input.cardPos as CardPos)
      : defaultCardPos(mood),
    previously: cleanText(input.previously, PREVIOUSLY_MAX),
    widget,
    counters: sanitizeCounters(input.counters),
    poll: sanitizePoll(input.poll),
    ticker: Array.isArray(input.ticker)
      ? input.ticker
          .map((line) => cleanText(line, GAME_TICKER_ITEM_MAX))
          .filter(Boolean)
          .slice(0, GAME_TICKER_MAX)
      : [],
    finalPart: input.finalPart === true,
    completedAt: isTime(input.completedAt) ? input.completedAt : null,
    art: sanitizeArt(input.art),
  };
}

/**
 * Valid library from untrusted input. A missing library (state saved before
 * v4) becomes the default one; an empty list stays empty.
 */
export function sanitizeGames(input: unknown): Games {
  if (!isObject(input) || !Array.isArray(input.list)) return DEFAULT_GAMES;
  const taken = new Set<string>();
  const list: GameProfile[] = [];
  for (const raw of input.list) {
    const profile = sanitizeProfile(raw, taken);
    if (!profile) continue;
    taken.add(profile.id);
    list.push(profile);
    if (list.length === GAMES_MAX) break;
  }
  // Defaults added since this library was saved join it once; ones the
  // library already had (even if deleted since) stay as they are. A library
  // saved before `known` existed had every first-wave default.
  const known = new Set(
    Array.isArray(input.known)
      ? input.known.filter(isId)
      : DEFAULT_IDS.filter((id) => !ADDED_LATER.includes(id)),
  );
  for (const seed of DEFAULT_LIBRARY) {
    if (known.has(seed.id)) continue;
    known.add(seed.id);
    if (!taken.has(seed.id) && list.length < GAMES_MAX) {
      taken.add(seed.id);
      list.push(seed);
    }
  }
  const current = isId(input.current) && taken.has(input.current) ? input.current : null;
  return { list, current, known: [...known].filter((id) => DEFAULT_IDS.includes(id)) };
}

// ---------------------------------------------------------------- live values

/** Parse a Redis HGETALL answer (flat array or object) into live values. */
export function liveFromHash(raw: unknown): GameLive {
  const record: Record<string, unknown> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) record[String(raw[i])] = raw[i + 1];
  } else if (isObject(raw)) {
    Object.assign(record, raw);
  }
  const live = { ...EMPTY_LIVE };
  for (const field of LIVE_FIELDS) {
    const n = Number(record[field]);
    if (Number.isFinite(n)) {
      live[field] = Math.min(LIVE_VALUE_MAX, Math.max(field === "part" ? 1 : 0, Math.round(n)));
    }
  }
  return live;
}

export const isLiveField = (value: unknown): value is LiveField =>
  LIVE_FIELDS.includes(value as LiveField);

/**
 * Stream Deck actions: "c1+", "c1-", "c2+", "c2-", "part+", "part-", "w",
 * "d", "l", "gf", "ga", "gf-", "ga-", "hour+". `null` for anything else.
 */
export function parseDeckAction(raw: unknown): { field: LiveField; by: number } | null {
  if (typeof raw !== "string") return null;
  const m = raw.trim().toLowerCase().match(/^(c1|c2|part|w|d|l|gf|ga|hour)([+-]?)$/);
  if (!m) return null;
  const by = m[2] === "-" ? -1 : 1;
  if (m[1] === "hour") return { field: "mins", by: by * 60 };
  return { field: m[1] as LiveField, by };
}

// ---------------------------------------------------------------- public view

export type PublicCounter = { label: string; value: number; total: number | null };

/** The current game as the website and overlays see it. */
export type PublicPlay = {
  id: string;
  name: string;
  mood: Mood;
  unit: string;
  part: number | null;
  goal: string;
  previously: string;
  widget: Widget;
  counters: PublicCounter[];
  football: {
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    /** Show W/D/L, show goals scored : conceded. */
    record: boolean;
    goals: boolean;
  };
  /** Show the game-name card. */
  title: boolean;
  cardPos: CardPos;
  poll: { question: string; options: string[]; openedAt: number } | null;
  ticker: string[];
  finalPart: boolean;
  completed: boolean;
  hours: number;
  /** Share-link preview images (Blob URLs), or `null`. */
  art: ShareArt | null;
};

/** A finished series for the website's shelf. */
export type ShelfItem = {
  name: string;
  mood: Mood;
  parts: number;
  hours: number;
  counters: PublicCounter[];
  completedAt: number;
};

export const SHELF_MAX = 12;

const hours = (mins: number) => Math.round((mins / 60) * 10) / 10;

function publicCounters(profile: GameProfile, live: GameLive): PublicCounter[] {
  return profile.counters.map((c, i) => ({
    label: c.label,
    value: i === 0 ? live.c1 : live.c2,
    total: c.total,
  }));
}

export function publicPlay(profile: GameProfile, live: GameLive = EMPTY_LIVE): PublicPlay {
  const poll =
    profile.widget === "poll" && profile.poll.open && profile.poll.question
      ? {
          question: profile.poll.question,
          options: profile.poll.options.filter(Boolean),
          openedAt: profile.poll.openedAt ?? 0,
        }
      : null;
  return {
    id: profile.id,
    name: profile.name,
    mood: profile.mood,
    unit: profile.unit,
    part: profile.showPart ? live.part : null,
    goal: profile.showGoal ? profile.goal : "",
    previously: profile.previously,
    widget: profile.widget,
    counters: profile.widget === "counters" ? publicCounters(profile, live) : [],
    football: {
      w: live.w,
      d: live.d,
      l: live.l,
      gf: live.gf,
      ga: live.ga,
      record: profile.showRecord,
      goals: profile.showGoals,
    },
    title: profile.showTitle,
    cardPos: profile.cardPos,
    poll: poll && poll.options.length >= 2 ? poll : null,
    ticker: profile.ticker,
    finalPart: profile.finalPart && !profile.completedAt,
    completed: profile.completedAt !== null,
    hours: hours(live.mins),
    art: profile.art,
  };
}

/** The game on stream, or `null`. */
export function currentProfile(games: Games): GameProfile | null {
  return games.list.find((g) => g.id === games.current) ?? null;
}

/** Finished series, newest first. */
export function completedProfiles(games: Games): GameProfile[] {
  return games.list
    .filter((g) => g.completedAt !== null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, SHELF_MAX);
}

export function shelf(games: Games, live: Record<string, GameLive>): ShelfItem[] {
  return completedProfiles(games).map((g) => {
    const values = live[g.id] ?? EMPTY_LIVE;
    return {
      name: g.name,
      mood: g.mood,
      parts: values.part,
      hours: hours(values.mins),
      counters: publicCounters(g, values),
      completedAt: g.completedAt ?? 0,
    };
  });
}

/** "Part 3", or "" when the part is hidden. */
export function partLabel(play: Pick<PublicPlay, "unit" | "part">): string {
  return play.part === null ? "" : `${play.unit} ${play.part}`;
}
