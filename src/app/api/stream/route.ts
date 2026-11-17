import { connection } from "next/server";
import { loadPublicStatus } from "@/lib/stream/store";

/**
 * GET /api/stream — the public stream status for the website and the OBS
 * overlays. The CDN may serve the same answer for 5 seconds, so many
 * overlays polling at once still cost about one Redis read per 5 seconds.
 */
export async function GET() {
  // Always run at request time, never prerendered at build.
  await connection();
  const status = await loadPublicStatus();
  return Response.json(status, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=10",
      // Overlays may also be opened as local files during testing.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
