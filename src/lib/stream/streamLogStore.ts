import { redis } from "./redis";
import { LOG_MAX_ENTRIES, sortEntries, sanitizeLogEntry, type StreamLogEntry } from "./streamLog";

/** One Redis hash: field = entry id, value = entry JSON. */
const LOG_KEY = "madnco:streamlog";

/** Every logged stream, oldest first. One HGETALL. */
export async function loadLogs(): Promise<StreamLogEntry[]> {
  const raw = await redis<string[] | Record<string, string> | null>(["HGETALL", LOG_KEY]);
  const values = Array.isArray(raw)
    ? raw.filter((_, i) => i % 2 === 1)
    : raw && typeof raw === "object"
      ? Object.values(raw)
      : [];
  const out: StreamLogEntry[] = [];
  for (const value of values) {
    try {
      const parsed = JSON.parse(value) as StreamLogEntry;
      // Re-check, keeping the stored id and time stamp.
      const clean = sanitizeLogEntry(parsed, parsed.updatedAt || 0);
      if (clean) out.push({ ...clean, id: parsed.id, updatedAt: parsed.updatedAt || 0 });
    } catch {
      // Skip a broken entry rather than the whole log.
    }
  }
  return sortEntries(out);
}

/** Create or replace one entry. `false` when the log is full. */
export async function saveLog(entry: StreamLogEntry): Promise<boolean> {
  const exists = await redis<number>(["HEXISTS", LOG_KEY, entry.id]);
  if (!exists && (await redis<number>(["HLEN", LOG_KEY])) >= LOG_MAX_ENTRIES) return false;
  await redis(["HSET", LOG_KEY, entry.id, JSON.stringify(entry)]);
  return true;
}

export async function deleteLog(id: string): Promise<void> {
  await redis(["HDEL", LOG_KEY, id]);
}
