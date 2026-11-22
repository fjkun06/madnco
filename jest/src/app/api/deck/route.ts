import { timingSafeEqual } from "node:crypto";
import { after, connection } from "next/server";
import { parseDeckAction } from "@/lib/stream/games";
import { changeGameLive } from "@/lib/stream/gameStore";
import { publishStatus } from "@/lib/stream/realtime";
import { hit, redisConfigured } from "@/lib/stream/redis";
import { loadState } from "@/lib/stream/store";

/** Stream Deck presses per minute before we say no. */
const PER_MINUTE = 120;

function keyMatches(given: string | null): boolean {
  const secret = process.env.DECK_KEY ?? "";
  if (secret.length < 24 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

const text = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

/**
 * GET /api/deck?key=…&do=c1+ — a Stream Deck key press (Website action,
 * "GET request in background"). Changes a live value of the game that is on
 * stream right now: c1± c2± (counters), part±, w d l (scoreboard), gf± ga±
 * (goals), hour± (hours played). Needs DECK_KEY (24+ characters).
 */
export async function GET(request: Request) {
  await connection();
  const params = new URL(request.url).searchParams;
  if (!keyMatches(params.get("key"))) return text("unauthorized", 401);
  if (!redisConfigured()) return text("storage not configured", 503);
  const action = parseDeckAction(params.get("do"));
  if (!action) return text("unknown action", 400);
  try {
    if ((await hit("madnco:deck:rate", 60)) > PER_MINUTE) return text("slow down", 429);
    const state = await loadState();
    const id = state.games.current;
    if (!id) return text("no game on stream", 409);
    const live = await changeGameLive(id, action.field, { by: action.by });
    after(publishStatus);
    return text(`ok ${action.field}=${live[action.field]}`, 200);
  } catch (error) {
    console.error("[deck] failed", error);
    return text("failed", 500);
  }
}
