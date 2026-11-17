/**
 * Stream of the day: what the admin panel stores, and the public view of it
 * that the website and the OBS overlays read from /api/stream.
 *
 * Pure functions only (no I/O), so every rule here is unit-tested.
 */

/** How the live status is decided. */
export type LiveMode = "auto" | "live" | "off";

/** Games offered as one-tap chips in the admin panel. Any text is allowed. */
export const GAME_CHIPS = [
  "FIFA",
  "CoD",
  "RDR2",
  "Cyberpunk",
  "Just Chatting",
  "OmeTV",
] as const;

/** A countdown on the Starting Soon screen: epoch milliseconds. */
export type Countdown = { from: number; to: number };

/** The next planned stream, shown on Ending and on the website. */
export type NextStream = { at: number; plan: string; show: boolean };

/** Everything the admin panel saves. */
export type StreamState = {
  mode: LiveMode;
  topic: string;
  game: string;
  countdown: Countdown | null;
  next: NextStream | null;
  updatedAt: number;
};

/** What the website and overlays get: no admin-only fields. */
export type PublicStatus = {
  live: boolean;
  /** Why `live` is what it is: Twitch said so, or the admin set it. */
  source: "twitch" | "manual" | "none";
  topic: string;
  game: string;
  countdown: Countdown | null;
  next: { at: number; plan: string } | null;
};

export const TOPIC_MAX = 80;
export const GAME_MAX = 32;
export const PLAN_MAX = 80;

/** A countdown that ended more than this long ago is dropped. */
export const COUNTDOWN_GRACE_MS = 30 * 60 * 1000;
/** A "next stream" that started more than this long ago is dropped. */
export const NEXT_GRACE_MS = 2 * 60 * 60 * 1000;

export const DEFAULT_STATE: StreamState = {
  mode: "auto",
  topic: "",
  game: "",
  countdown: null,
  next: null,
  updatedAt: 0,
};

/** Collapse whitespace, strip control characters and cut to `max`. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Turn untrusted input (the admin's request body, or whatever is stored)
 * into a valid state. Unknown fields are dropped, bad values fall back to
 * the defaults, so a broken save can never break the overlays.
 */
export function sanitizeState(input: unknown, now: number): StreamState {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  const mode: LiveMode =
    raw.mode === "live" || raw.mode === "off" || raw.mode === "auto" ? raw.mode : "auto";

  let countdown: Countdown | null = null;
  const cd = raw.countdown as Record<string, unknown> | null | undefined;
  if (cd && isTime(cd.from) && isTime(cd.to) && cd.to > cd.from) {
    countdown = { from: cd.from, to: cd.to };
  }

  let next: NextStream | null = null;
  const nx = raw.next as Record<string, unknown> | null | undefined;
  if (nx && isTime(nx.at)) {
    next = { at: nx.at, plan: cleanText(nx.plan, PLAN_MAX), show: nx.show !== false };
  }

  return {
    mode,
    topic: cleanText(raw.topic, TOPIC_MAX),
    game: cleanText(raw.game, GAME_MAX),
    countdown,
    next,
    updatedAt: isTime(raw.updatedAt) ? raw.updatedAt : now,
  };
}

/**
 * The public view. `twitchLive` is the Twitch API answer (`null` when it is
 * unknown, e.g. no credentials or Twitch is down); `twitchGame` fills the
 * game when the admin left it empty.
 */
export function publicStatus(
  state: StreamState,
  twitchLive: boolean | null,
  now: number,
  twitchGame = "",
): PublicStatus {
  let live = false;
  let source: PublicStatus["source"] = "none";
  if (state.mode === "live") {
    live = true;
    source = "manual";
  } else if (state.mode === "auto" && twitchLive) {
    live = true;
    source = "twitch";
  }

  const countdown =
    state.countdown && state.countdown.to + COUNTDOWN_GRACE_MS > now
      ? state.countdown
      : null;

  const next =
    state.next && state.next.show && state.next.at + NEXT_GRACE_MS > now
      ? { at: state.next.at, plan: state.next.plan }
      : null;

  return {
    live,
    source,
    topic: state.topic,
    game: state.game || (source === "twitch" ? cleanText(twitchGame, GAME_MAX) : ""),
    countdown,
    next,
  };
}

/** The offline status the site renders before /api/stream has answered. */
export const OFFLINE_STATUS: PublicStatus = publicStatus(DEFAULT_STATE, null, 0);

/** "Game · Topic", leaving out whichever is empty. */
export function nowPlayingText(status: Pick<PublicStatus, "game" | "topic">): string {
  return [status.game, status.topic].filter(Boolean).join(" · ");
}

/**
 * When the next stream is, for people: "Sat · 20:00" within a week,
 * "Sat 29 Nov · 20:00" further out. In the viewer's own time zone unless
 * `timeZone` is given (tests).
 */
export function formatNextWhen(
  at: number,
  now: number,
  locale?: string,
  timeZone?: string,
): string {
  const date = new Date(at);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
  const withinWeek = at - now < 6 * 24 * 60 * 60 * 1000;
  const day = new Intl.DateTimeFormat(
    locale,
    withinWeek
      ? { weekday: "short", timeZone }
      : { weekday: "short", day: "numeric", month: "short", timeZone },
  ).format(date);
  return `${day.replace(/,/g, "")} · ${time}`;
}
