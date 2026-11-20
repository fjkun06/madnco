import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { applyQuick, parseQuickOp } from "@/lib/stream/quick";
import { redisConfigured } from "@/lib/stream/redis";
import { loadState, saveState } from "@/lib/stream/store";

/**
 * POST /api/admin/quick — one tap from the Remote (BRB timer, ticker, final
 * part, poll, game on stream, Co tonight, Home/Guest). Applied to the saved
 * state on the server, so it never overwrites anything else.
 */
export async function POST(request: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "json-only" }, { status: 415 });
  }
  if (!redisConfigured()) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 503 });
  }
  const op = parseQuickOp(await request.json().catch(() => null));
  if (!op) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  try {
    const next = applyQuick(await loadState(), op, Date.now());
    if (!next) return NextResponse.json({ error: "not-possible" }, { status: 409 });
    const result = await saveState(next);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
    return NextResponse.json(result.state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin] quick change failed", error);
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }
}
