/**
 * Where MadnCo. is live (our own @madnco8 channels, or a borrowed "guest"
 * channel), and who sits in the Co seat tonight. Pure, so it is unit-tested.
 */

import { cleanText } from "./extras";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// ---------------------------------------------------------------- channels

/** Landscape = Twitch + YouTube scenes; vertical = the TikTok scenes. */
export const CANVASES = ["landscape", "vertical"] as const;
export type Canvas = (typeof CANVASES)[number];

export type ChannelMode = { guest: boolean; host: string };

export type Channels = {
  landscape: ChannelMode;
  vertical: ChannelMode;
  /** The small line over "This channel got hijacked" on Starting Soon. */
  guestLine: string;
  /** Show the "Our home is @madnco8" card on Gaming. */
  homeCard: boolean;
};

export const HOST_MAX = 32;
export const GUEST_LINE_MAX = 60;

export const DEFAULT_CHANNELS: Channels = {
  landscape: { guest: false, host: "@madhauzz" },
  // TikTok LIVE runs on @clipzhub06 until @madnco8 has 50 followers.
  vertical: { guest: true, host: "@clipzhub06" },
  guestLine: "Anime clips are off tonight",
  homeCard: true,
};

/** "madhauzz", "@madhauzz", " @Mad.Hauzz " → "@madhauzz"-style handle, or "". */
export function cleanHandle(value: unknown): string {
  if (typeof value !== "string") return "";
  const bare = value.trim().replace(/^@+/, "");
  return /^[\w.-]{1,31}$/.test(bare) ? `@${bare}` : "";
}

function sanitizeMode(input: unknown, fallback: ChannelMode): ChannelMode {
  if (!isObject(input)) return fallback;
  return {
    guest: input.guest === true,
    host: cleanHandle(input.host) || fallback.host,
  };
}

export function sanitizeChannels(input: unknown): Channels {
  if (!isObject(input)) return DEFAULT_CHANNELS;
  return {
    landscape: sanitizeMode(input.landscape, DEFAULT_CHANNELS.landscape),
    vertical: sanitizeMode(input.vertical, DEFAULT_CHANNELS.vertical),
    guestLine: cleanText(input.guestLine, GUEST_LINE_MAX),
    homeCard: input.homeCard !== false,
  };
}

/** The guest channel's live page: YouTube for landscape, TikTok for vertical. */
export function hostUrl(canvas: Canvas, host: string): string {
  const handle = encodeURIComponent(host.replace(/^@/, ""));
  return canvas === "landscape"
    ? `https://www.youtube.com/@${handle}/live`
    : `https://www.tiktok.com/@${handle}/live`;
}

export type PublicChannelMode = { guest: boolean; host: string; url: string };
export type PublicChannels = {
  landscape: PublicChannelMode;
  vertical: PublicChannelMode;
  guestLine: string;
  homeCard: boolean;
};

export function publicChannels(channels: Channels): PublicChannels {
  const view = (canvas: Canvas) => ({
    ...channels[canvas],
    url: hostUrl(canvas, channels[canvas].host),
  });
  return {
    landscape: view("landscape"),
    vertical: view("vertical"),
    guestLine: channels.guestLine,
    homeCard: channels.homeCard,
  };
}

// ---------------------------------------------------------------- co

/** Who's in the Co seat tonight ("" = solo, slot open) and every past Co. */
export type Co = { name: string; roster: string[] };

export const CO_NAME_MAX = 24;
export const CO_ROSTER_MAX = 12;

/** Courinho is the OG Co. */
export const DEFAULT_CO: Co = { name: "", roster: ["Courinho"] };

export function sanitizeCo(input: unknown): Co {
  if (!isObject(input)) return DEFAULT_CO;
  const roster: string[] = [];
  const seen = new Set<string>();
  const add = (raw: unknown) => {
    const name = cleanText(raw, CO_NAME_MAX);
    if (!name || seen.has(name.toLowerCase()) || roster.length >= CO_ROSTER_MAX) return;
    seen.add(name.toLowerCase());
    roster.push(name);
  };
  if (Array.isArray(input.roster)) input.roster.forEach(add);
  const name = cleanText(input.name, CO_NAME_MAX);
  if (name) add(name);
  return { name, roster };
}

/** Pick tonight's Co; a new name joins the roster. "" = solo. */
export function pickCo(co: Co, name: string): Co {
  return sanitizeCo({ roster: co.roster, name });
}
