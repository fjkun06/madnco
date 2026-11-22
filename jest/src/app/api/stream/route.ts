import { connection } from "next/server";
import { realtimePublic } from "@/lib/stream/realtime";
import { loadPublicStatus } from "@/lib/stream/store";

/**
 * GET /api/stream — the public stream status for the website and the OBS
 * overlays. The CDN serves the same answer for 3 seconds, so all overlays
 * together cost at most one run (~5 Redis commands) per 3 seconds: about
 * 6,000 commands per hour of streaming, which keeps ~70 streaming hours a
 * month inside Upstash's free 500K commands. No stale-while-revalidate, so a
 * change shows within ~3–5 s (overlays poll every 2 s).
 */
export async function GET() {
  // Always run at request time, never prerendered at build.
  await connection();
  const status = await loadPublicStatus();
  // `realtime`: where overlays listen for instant updates (null = poll only).
  return Response.json({ ...status, realtime: realtimePublic() }, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3",
      // Overlays may also be opened as local files during testing.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
