import "server-only";

/**
 * Minimal Upstash Redis client over its REST API, so no extra npm package.
 * Vercel's Upstash integration sets either the UPSTASH_* or the older KV_*
 * variables; both are accepted.
 */

type Config = { url: string; token: string };

function config(): Config | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

/** `true` when Redis credentials are configured. */
export function redisConfigured(): boolean {
  return config() !== null;
}

/** Run one Redis command, e.g. `["GET", "key"]`. Throws on HTTP or Redis errors. */
export async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Redis is not configured (UPSTASH_REDIS_REST_URL/TOKEN).");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || body.error) {
    throw new Error(`Redis ${String(command[0])} failed: ${body.error ?? res.status}`);
  }
  return body.result as T;
}

/** Read a JSON value; `null` when missing or unreadable. */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await redis<string | null>(["GET", key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Write a JSON value, optionally expiring after `ttlSeconds`. */
export async function setJSON(
  key: string,
  value: unknown,
  ttlSeconds?: number,
): Promise<void> {
  const command: (string | number)[] = ["SET", key, JSON.stringify(value)];
  if (ttlSeconds) command.push("EX", ttlSeconds);
  await redis(command);
}

/** Increment a counter that expires `windowSeconds` after its first hit. */
export async function hit(key: string, windowSeconds: number): Promise<number> {
  const count = await redis<number>(["INCR", key]);
  if (count === 1) await redis(["EXPIRE", key, windowSeconds]);
  return count;
}
