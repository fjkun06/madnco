import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
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
  try {
    const result = await saveState(await request.json());
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
