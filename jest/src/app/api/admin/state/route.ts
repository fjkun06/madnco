import { after, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { publishStatus } from "@/lib/stream/realtime";
import { redisConfigured } from "@/lib/stream/redis";
import { loadState, saveState } from "@/lib/stream/store";

/** GET /api/admin/state — the full saved state (admin only). */
export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await loadState(), {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * PUT /api/admin/state — validate and save the whole state (admin only).
 * 422 when a new date is already over.
 */
export async function PUT(request: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // JSON only: a plain cross-site form can't send this content type.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "json-only" }, { status: 415 });
  }
  if (!redisConfigured()) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 503 });
  }
  // Push the result to the overlays once this answer is sent (Ably).
  after(publishStatus);
  try {
    const body: unknown = await request.json();
    // The Remote may have changed things since this form was loaded: refuse
    // a save that is based on an older state, and send the latest back.
    const base =
      typeof body === "object" && body !== null && "updatedAt" in body
        ? Number((body as { updatedAt: unknown }).updatedAt)
        : NaN;
    const latest = await loadState();
    if (Number.isFinite(base) && base < latest.updatedAt) {
      return NextResponse.json({ error: "stale", state: latest }, { status: 409 });
    }
    const result = await saveState(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json(result.state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[admin] save failed", error);
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }
}
