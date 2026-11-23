import { after, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { isLiveField } from "@/lib/stream/games";
import { changeGameLive, loadGameLive, resetGameLive } from "@/lib/stream/gameStore";
import { publishPlay } from "@/lib/stream/realtime";
import { loadState } from "@/lib/stream/store";
import { redisConfigured } from "@/lib/stream/redis";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const isId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9-]{1,56}$/.test(value);

/** GET /api/admin/game?ids=a,b — live values (part, counters …) by game id. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter(isId);
  return NextResponse.json(await loadGameLive(ids), {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * POST /api/admin/game — change one live value right away (no Save needed).
 * Body: { id, field, by } or { id, field, value } or { id, reset: true }.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "json-only" }, { status: 415 });
  }
  if (!redisConfigured()) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!isId(body.id)) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  const id = body.id;
  // Read the saved state alongside the change, so the overlay push needs no
  // extra round trip (Ably fast lane, sent right after this answer).
  const state = loadState().catch(() => null);
  const push = (live: Awaited<ReturnType<typeof changeGameLive>>) =>
    after(async () => {
      const saved = await state;
      if (saved) await publishPlay(saved, id, live);
    });

  try {
    if (body.reset === true) {
      const live = await resetGameLive(id);
      push(live);
      return NextResponse.json(live);
    }
    if (!isLiveField(body.field)) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }
    const by = typeof body.by === "number" && Number.isFinite(body.by) ? body.by : null;
    const value =
      typeof body.value === "number" && Number.isFinite(body.value) ? body.value : null;
    if (by === null && value === null) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }
    const live = await changeGameLive(
      id,
      body.field,
      by !== null ? { by: Math.max(-600, Math.min(600, by)) } : { value: value! },
    );
    push(live);
    return NextResponse.json(live, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin] game change failed", error);
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }
}
