/**
 * The Founding 50 and on-stream alerts. The first 50 followers of @madnco8
 * get their name on the Founders Wall (website), in the Ending credits and a
 * follow alert on stream. Alerts also welcome first-time chatters.
 *
 * Pure: parsing and shaping only, so every rule is unit-tested. Storage lives
 * in fanStore.ts.
 */

import { cleanText } from "./extras";

export const FOUNDERS_MAX = 50;
export const FAN_NAME_MAX = 32;
/** Alerts older than this are not played any more (an overlay opened later). */
export const ALERT_TTL_MS = 120_000;
export const ALERTS_KEPT = 20;

export const PLATFORMS = ["tiktok", "youtube", "twitch", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type Founder = { name: string; platform: Platform; at: number };

/**
 * One thing to show on stream. `follow` with a name = a new founder (or fan
 * once the wall is full); `follow` without a name = "someone just followed"
 * (a count went up, nobody named); `welcome` = someone's first chat message.
 */
export type Alert = {
  id: string;
  kind: "follow" | "welcome";
  name: string;
  platform: Platform;
  /** Founder number, or null once the wall is full / for welcomes. */
  n: number | null;
  at: number;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isPlatform = (value: unknown): value is Platform =>
  PLATFORMS.includes(value as Platform);

/** "@Kevin_98 " → "@Kevin_98"; "kevin" → "@kevin"; display names keep spaces. */
export function cleanFanName(value: unknown): string {
  const name = cleanText(value, FAN_NAME_MAX);
  if (!name) return "";
  return /\s/.test(name) || name.startsWith("@") ? name : `@${name}`;
}

/** Case-insensitive key, so "@Kevin" and "kevin" are the same founder. */
export const fanKey = (name: string) => name.replace(/^@/, "").toLowerCase();

export function parseFounder(raw: unknown): Founder | null {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isObject(value)) return null;
  const name = cleanFanName(value.name);
  if (!name) return null;
  return {
    name,
    platform: isPlatform(value.platform) ? value.platform : "other",
    at: typeof value.at === "number" && Number.isFinite(value.at) ? value.at : 0,
  };
}

export function parseAlert(raw: unknown): Alert | null {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!isObject(value) || typeof value.id !== "string") return null;
  if (value.kind !== "follow" && value.kind !== "welcome") return null;
  if (typeof value.at !== "number" || !Number.isFinite(value.at)) return null;
  const n = typeof value.n === "number" && value.n >= 1 && value.n <= FOUNDERS_MAX ? value.n : null;
  return {
    id: value.id.slice(0, 40),
    kind: value.kind,
    name: cleanFanName(value.name),
    platform: isPlatform(value.platform) ? value.platform : "other",
    n,
    at: value.at,
  };
}

/** Alerts still worth playing, oldest first (the overlay plays them in order). */
export function liveAlerts(alerts: Alert[], now: number): Alert[] {
  return alerts
    .filter((a) => now - a.at <= ALERT_TTL_MS && a.at <= now + 5_000)
    .sort((a, b) => a.at - b.at);
}

export function newAlertId(now: number, rand: () => number = Math.random): string {
  return `${now.toString(36)}${Math.floor(rand() * 1e6).toString(36)}`;
}

/** What the website and overlays see. */
export type PublicFans = {
  founders: { name: string; platform: Platform }[];
  goal: number;
  alerts: Alert[];
};

export const EMPTY_FANS: PublicFans = { founders: [], goal: FOUNDERS_MAX, alerts: [] };

export function publicFans(founders: Founder[], alerts: Alert[], now: number): PublicFans {
  return {
    founders: founders.slice(0, FOUNDERS_MAX).map(({ name, platform }) => ({ name, platform })),
    goal: FOUNDERS_MAX,
    alerts: liveAlerts(alerts, now),
  };
}
