import { after, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { loadTwitchConnection, twitchReadyToConnect } from "@/lib/stream/connections";
import { addFollower, loadFounders, pushAlert, removeFounder } from "@/lib/stream/fanStore";
import { isPlatform } from "@/lib/stream/fans";
import { publishStatus } from "@/lib/stream/realtime";
import { redisConfigured } from "@/lib/stream/redis";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

async function overview() {
  const [founders, twitch] = await Promise.all([loadFounders(), loadTwitchConnection()]);
  return { founders, twitch: { ready: twitchReadyToConnect(), connection: twitch } };
}

/** GET /api/admin/fans — the founders and the Twitch connection. */
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  if (!redisConfigured()) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 503 });
  }
  return NextResponse.json(await overview(), { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/admin/fans
 *   { op: "add", name, platform, alert }  shout-out (alert) or add after the stream
 *   { op: "remove", name }                take someone off the wall
 *   { op: "test", kind: "follow" | "welcome" }
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
  // Push the result to the overlays once this answer is sent (Ably).
  after(publishStatus);
  try {
    switch (body.op) {
      case "add": {
        if (typeof body.name !== "string" || !body.name.trim()) {
          return NextResponse.json({ error: "bad-request" }, { status: 400 });
        }
        const platform = isPlatform(body.platform) ? body.platform : "other";
        const result = await addFollower({ name: body.name, platform }, { alert: body.alert !== false });
        return NextResponse.json({ ...(await overview()), result });
      }
      case "remove":
        if (typeof body.name !== "string") return NextResponse.json({ error: "bad-request" }, { status: 400 });
        await removeFounder(body.name);
        return NextResponse.json(await overview());
      case "test":
        await pushAlert(
          body.kind === "welcome"
            ? { kind: "welcome", name: "@test_viewer", platform: "other", n: null }
            : { kind: "follow", name: "@test_viewer", platform: "other", n: 28 },
        );
        return NextResponse.json(await overview());
      default:
        return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }
  } catch (error) {
    console.error("[admin] fans failed", error);
    return NextResponse.json({ error: "save-failed" }, { status: 500 });
  }
}
