import "server-only";
import {
  ALERTS_KEPT,
  EMPTY_FANS,
  FOUNDERS_MAX,
  cleanFanName,
  fanKey,
  newAlertId,
  parseAlert,
  parseFounder,
  publicFans,
  type Alert,
  type Founder,
  type Platform,
  type PublicFans,
} from "./fans";
import { redis, redisConfigured, redisPipeline } from "./redis";

/**
 * Founders = a Redis list (order = founder number) plus a set of names, so
 * the same person is never added twice even if two sources race. Alerts = a
 * short Redis list, newest first.
 */
const FOUNDERS = "madnco:founders";
const FOUNDER_NAMES = "madnco:founders:names";
const ALERTS = "madnco:alerts";

export async function loadFounders(): Promise<Founder[]> {
  const raw = await redis<string[]>(["LRANGE", FOUNDERS, 0, FOUNDERS_MAX - 1]);
  return (raw ?? []).map(parseFounder).filter((f): f is Founder => f !== null);
}

/** Founders + recent alerts for /api/stream; empty when Redis is missing or down. */
export async function loadPublicFans(now = Date.now()): Promise<PublicFans> {
  if (!redisConfigured()) return EMPTY_FANS;
  try {
    const [founders, alerts] = await redisPipeline<string[]>([
      ["LRANGE", FOUNDERS, 0, FOUNDERS_MAX - 1],
      ["LRANGE", ALERTS, 0, ALERTS_KEPT - 1],
    ]);
    return publicFans(
      (founders ?? []).map(parseFounder).filter((f): f is Founder => f !== null),
      (alerts ?? []).map(parseAlert).filter((a): a is Alert => a !== null),
      now,
    );
  } catch (error) {
    console.error("[fans] load failed", error);
    return EMPTY_FANS;
  }
}

export async function pushAlert(alert: Omit<Alert, "id" | "at">, now = Date.now()) {
  const full: Alert = { ...alert, id: newAlertId(now), at: now };
  await redisPipeline([
    ["LPUSH", ALERTS, JSON.stringify(full)],
    ["LTRIM", ALERTS, 0, ALERTS_KEPT - 1],
  ]);
  return full;
}

/**
 * Someone followed. Named and new → joins the wall (while there's room) and
 * gets an alert with their founder number; already a founder → nothing;
 * nameless → a "someone just followed" alert. `alert: false` adds silently
 * (names added after the stream).
 */
export async function addFollower(
  input: { name: string; platform: Platform },
  options: { alert?: boolean } = {},
): Promise<{ added: boolean; n: number | null }> {
  const name = cleanFanName(input.name);
  const play = options.alert !== false;
  if (!name) {
    if (play) await pushAlert({ kind: "follow", name: "", platform: input.platform, n: null });
    return { added: false, n: null };
  }
  const isNew = await redis<number>(["SADD", FOUNDER_NAMES, fanKey(name)]);
  if (!isNew) return { added: false, n: null };
  let n: number | null = null;
  const count = await redis<number>(["LLEN", FOUNDERS]);
  if (count < FOUNDERS_MAX) {
    const founder: Founder = { name, platform: input.platform, at: Date.now() };
    n = await redis<number>(["RPUSH", FOUNDERS, JSON.stringify(founder)]);
    if (n > FOUNDERS_MAX) n = null;
  }
  if (play) await pushAlert({ kind: "follow", name, platform: input.platform, n });
  return { added: n !== null, n };
}

/** Take a founder off the wall (a typo, a troll). Later founders move up. */
export async function removeFounder(name: string): Promise<void> {
  const key = fanKey(name);
  const founders = await loadFounders();
  const target = founders.find((f) => fanKey(f.name) === key);
  if (!target) return;
  const raw = await redis<string[]>(["LRANGE", FOUNDERS, 0, FOUNDERS_MAX - 1]);
  const exact = (raw ?? []).find((r) => {
    const f = parseFounder(r);
    return f !== null && fanKey(f.name) === key;
  });
  if (exact) await redis(["LREM", FOUNDERS, 1, exact]);
  await redis(["SREM", FOUNDER_NAMES, key]);
}
