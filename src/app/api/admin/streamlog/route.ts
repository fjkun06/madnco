import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { redisConfigured } from "@/lib/stream/redis";
import { isLogId, sanitizeLogEntry } from "@/lib/stream/streamLog";
import { deleteLog, loadLogs, saveLog } from "@/lib/stream/streamLogStore";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function guard(request?: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  if (request && !request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "json-only" }, 415);
  }
  if (!redisConfigured()) return json({ error: "storage-not-configured" }, 503);
  return null;
}

/** GET /api/admin/streamlog — every logged stream, oldest first. */
export async function GET() {
  const blocked = await guard();
  if (blocked) return blocked;
  try {
    return json({ entries: await loadLogs() });
  } catch (error) {
    console.error("[streamlog] load failed", error);
    return json({ error: "load-failed" }, 500);
  }
}

/** POST { entry } — create (no id) or update (id) one stream. */
export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { entry?: unknown };
  const entry = sanitizeLogEntry(body.entry, Date.now());
  if (!entry) return json({ error: "bad-request" }, 400);
  try {
    if (!(await saveLog(entry))) return json({ error: "log-full" }, 409);
    return json({ entry });
  } catch (error) {
    console.error("[streamlog] save failed", error);
    return json({ error: "save-failed" }, 500);
  }
}

/** DELETE { id } — remove one stream. */
export async function DELETE(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (!isLogId(body.id)) return json({ error: "bad-request" }, 400);
  try {
    await deleteLog(body.id);
    return json({ ok: true });
  } catch (error) {
    console.error("[streamlog] delete failed", error);
    return json({ error: "save-failed" }, 500);
  }
}
