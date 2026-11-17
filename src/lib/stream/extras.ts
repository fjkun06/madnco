/**
 * The control room's extra blocks: BRB screen, ticker, side quest, latest
 * clip and presets. Types, defaults and the sanitizers that turn untrusted
 * input into valid values. Pure, so every rule here is unit-tested.
 */

import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";

// ---------------------------------------------------------------- helpers

/** Collapse whitespace, strip control characters and cut to `max`. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function wholeNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

// ---------------------------------------------------------------- BRB

/** The BRB screen: a message and an optional "back at" time (epoch ms). */
export type Brb = { message: string; until: number | null };

export const BRB_MESSAGE_MAX = 60;
/** A BRB timer that ended more than this long ago is dropped. */
export const BRB_GRACE_MS = 30 * 60 * 1000;
export const DEFAULT_BRB: Brb = { message: "", until: null };

export function sanitizeBrb(input: unknown): Brb {
  if (!isObject(input)) return DEFAULT_BRB;
  return {
    message: cleanText(input.message, BRB_MESSAGE_MAX),
    until: isTime(input.until) ? input.until : null,
  };
}

// ---------------------------------------------------------------- ticker

/** Scenes that can show the ticker. */
export const TICKER_SCENES = ["gaming", "chatting", "brb", "starting"] as const;
export type TickerScene = (typeof TICKER_SCENES)[number];

/** Lines that scroll in a loop on the chosen scenes. */
export type Ticker = { items: string[]; scenes: TickerScene[] };

export const TICKER_ITEM_MAX = 80;
export const TICKER_ITEMS_MAX = 8;
export const DEFAULT_TICKER: Ticker = {
  items: [],
  scenes: ["gaming", "chatting", "brb"],
};

export function sanitizeTicker(input: unknown): Ticker {
  if (!isObject(input)) return DEFAULT_TICKER;
  const items = Array.isArray(input.items)
    ? input.items
        .map((item) => cleanText(item, TICKER_ITEM_MAX))
        .filter(Boolean)
        .slice(0, TICKER_ITEMS_MAX)
    : [];
  const scenes = Array.isArray(input.scenes)
    ? TICKER_SCENES.filter((scene) => (input.scenes as unknown[]).includes(scene))
    : DEFAULT_TICKER.scenes;
  return { items, scenes };
}

// ---------------------------------------------------------------- side quest

/** The follower goal for going LIVE on @madnco8 (website + overlays). */
export type Quest = {
  /** `null` while unknown: the bar stays empty. */
  followers: number | null;
  goal: number;
  title: string;
  /** May use {handle}, {goal}, {liveHandle}, {left}. */
  text: string;
  /** Shown instead of `text` once followers ≥ goal. */
  doneText: string;
  /** Show the card on the website. */
  show: boolean;
  /** Show the XP card on BRB / Starting Soon (both formats). */
  onBrb: boolean;
  onStarting: boolean;
  /** Hide it on stream once the goal is reached. */
  hideWhenDone: boolean;
};

export const QUEST_TITLE_MAX = 40;
export const QUEST_TEXT_MAX = 200;
export const FOLLOWERS_MAX = 100_000_000;
export const GOAL_MAX = 100_000_000;

export const DEFAULT_QUEST: Quest = {
  followers: siteConfig.madncoFollowers,
  goal: siteConfig.liveFollowerGoal,
  title: en.quest.title,
  text: en.quest.text,
  doneText: en.quest.doneText,
  show: true,
  onBrb: true,
  onStarting: true,
  hideWhenDone: false,
};

export function sanitizeQuest(input: unknown): Quest {
  if (!isObject(input)) return DEFAULT_QUEST;
  const followers =
    input.followers === null ? null : wholeNumber(input.followers, 0, FOLLOWERS_MAX);
  return {
    followers: input.followers === undefined ? DEFAULT_QUEST.followers : followers,
    goal: wholeNumber(input.goal, 1, GOAL_MAX) ?? DEFAULT_QUEST.goal,
    title: cleanText(input.title, QUEST_TITLE_MAX) || DEFAULT_QUEST.title,
    text: cleanText(input.text, QUEST_TEXT_MAX) || DEFAULT_QUEST.text,
    doneText: cleanText(input.doneText, QUEST_TEXT_MAX) || DEFAULT_QUEST.doneText,
    show: input.show !== false,
    onBrb: input.onBrb !== false,
    onStarting: input.onStarting !== false,
    hideWhenDone: input.hideWhenDone === true,
  };
}

/** `true` once the follower count reached the goal. */
export function questDone(quest: Pick<Quest, "followers" | "goal">): boolean {
  return quest.followers !== null && quest.followers >= quest.goal;
}

/** Share of the goal reached, 0–1. */
export function questProgress(quest: Pick<Quest, "followers" | "goal">): number {
  if (quest.followers === null || quest.goal <= 0) return 0;
  return Math.min(1, Math.max(0, quest.followers / quest.goal));
}

/** The text to show (done or not), with the fill-ins replaced. */
export function questText(quest: Quest): string {
  const left = quest.followers === null ? quest.goal : Math.max(0, quest.goal - quest.followers);
  const fill: Record<string, string> = {
    handle: siteConfig.handles.tiktok,
    liveHandle: siteConfig.handles.tiktokLive,
    goal: String(quest.goal),
    left: String(left),
  };
  const template = questDone(quest) ? quest.doneText : quest.text;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => fill[key] ?? match);
}

// ---------------------------------------------------------------- latest clip

export type ClipPlatform = "tiktok" | "youtube" | "twitch";

/** A clip on the homepage. `id` is the video id (Twitch: the clip slug). */
export type Clip = {
  url: string;
  platform: ClipPlatform;
  id: string;
  title: string;
  tag: string;
  show: boolean;
};

export const CLIP_TITLE_MAX = 90;
export const CLIP_TAG_MAX = 20;
export const CLIP_URL_MAX = 300;

/**
 * Recognise a TikTok video, YouTube video/Short or Twitch clip link.
 * `null` for anything else, so no arbitrary URL is ever embedded.
 */
export function parseClipUrl(raw: string): { platform: ClipPlatform; id: string } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^(www|m|vm)\./, "");
  const path = url.pathname;

  if (host === "tiktok.com") {
    const m = path.match(/^\/@[\w.-]+\/video\/(\d{6,25})/);
    return m ? { platform: "tiktok", id: m[1] } : null;
  }
  if (host === "youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return { platform: "youtube", id: v };
    const m = path.match(/^\/(?:shorts|live|embed)\/([\w-]{11})/);
    return m ? { platform: "youtube", id: m[1] } : null;
  }
  if (host === "youtu.be") {
    const m = path.match(/^\/([\w-]{11})/);
    return m ? { platform: "youtube", id: m[1] } : null;
  }
  if (host === "clips.twitch.tv") {
    const m = path.match(/^\/([\w-]{4,100})$/);
    return m && m[1] !== "embed" ? { platform: "twitch", id: m[1] } : null;
  }
  if (host === "twitch.tv") {
    const m = path.match(/^\/\w+\/clip\/([\w-]{4,100})/);
    return m ? { platform: "twitch", id: m[1] } : null;
  }
  return null;
}

export function sanitizeClip(input: unknown): Clip | null {
  if (!isObject(input) || typeof input.url !== "string") return null;
  const url = input.url.trim().slice(0, CLIP_URL_MAX);
  const parsed = parseClipUrl(url);
  if (!parsed) return null;
  return {
    url,
    ...parsed,
    title: cleanText(input.title, CLIP_TITLE_MAX),
    tag: cleanText(input.tag, CLIP_TAG_MAX),
    show: input.show !== false,
  };
}

/**
 * The player URL, loaded only after a visitor taps play. Twitch needs the
 * page's host name as `parent`.
 */
export function clipEmbedUrl(clip: Pick<Clip, "platform" | "id">, host: string): string {
  const id = encodeURIComponent(clip.id);
  switch (clip.platform) {
    case "tiktok":
      return `https://www.tiktok.com/embed/v2/${id}`;
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    case "twitch":
      return `https://clips.twitch.tv/embed?clip=${id}&parent=${encodeURIComponent(host)}&autoplay=true`;
  }
}

// ---------------------------------------------------------------- presets

/** A one-tap fill for the Live tab. Admin only, never public. */
export type Preset = { name: string; topic: string; game: string; plan: string };

export const PRESET_NAME_MAX = 24;
export const PRESETS_MAX = 8;

export function sanitizePresets(
  input: unknown,
  limits: { topic: number; game: number; plan: number },
): Preset[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const presets: Preset[] = [];
  for (const raw of input) {
    if (!isObject(raw)) continue;
    const name = cleanText(raw.name, PRESET_NAME_MAX);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    presets.push({
      name,
      topic: cleanText(raw.topic, limits.topic),
      game: cleanText(raw.game, limits.game),
      plan: cleanText(raw.plan, limits.plan),
    });
    if (presets.length === PRESETS_MAX) break;
  }
  return presets;
}

// ---------------------------------------------------------------- shared

export { isTime };
