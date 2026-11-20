import "server-only";
import {
  EMPTY_LIVE,
  LIVE_VALUE_MAX,
  liveFromHash,
  type GameLive,
  type LiveField,
} from "./games";
import { redis, redisConfigured, redisPipeline } from "./redis";

/** One hash per game: part, c1, c2, w, d, l, gf, ga, mins. */
const key = (id: string) => `madnco:game:${id}`;

/** Live values for these games; defaults when missing or Redis is down. */
export async function loadGameLive(ids: string[]): Promise<Record<string, GameLive>> {
  const unique = [...new Set(ids)].slice(0, 16);
  const out: Record<string, GameLive> = {};
  if (!unique.length) return out;
  if (!redisConfigured()) {
    for (const id of unique) out[id] = EMPTY_LIVE;
    return out;
  }
  try {
    const results = await redisPipeline(unique.map((id) => ["HGETALL", key(id)]));
    unique.forEach((id, i) => (out[id] = liveFromHash(results[i])));
  } catch (error) {
    console.error("[games] load failed", error);
    for (const id of unique) out[id] = EMPTY_LIVE;
  }
  return out;
}

/**
 * Change one live value: add `by` (atomic, so two quick key presses both
 * count) or set `value`. Never below 0 (part never below 1). Throws if
 * Redis fails.
 */
export async function changeGameLive(
  id: string,
  field: LiveField,
  change: { by: number } | { value: number },
): Promise<GameLive> {
  const min = field === "part" ? 1 : 0;
  if ("value" in change) {
    const value = Math.min(LIVE_VALUE_MAX, Math.max(min, Math.round(change.value)));
    await redis(["HSET", key(id), field, value]);
  } else {
    // A missing part starts at 1, so the first +1 makes it 2.
    if (field === "part") await redis(["HSETNX", key(id), "part", 1]);
    const next = await redis<number>(["HINCRBY", key(id), field, Math.round(change.by)]);
    if (next < min || next > LIVE_VALUE_MAX) {
      await redis(["HSET", key(id), field, Math.min(LIVE_VALUE_MAX, Math.max(min, next))]);
    }
  }
  return liveFromHash(await redis(["HGETALL", key(id)]));
}

/** Back to the start (part 1, everything 0). */
export async function resetGameLive(id: string): Promise<GameLive> {
  await redis(["DEL", key(id)]);
  return EMPTY_LIVE;
}
