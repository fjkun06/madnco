import { connection } from "next/server";
import { demoOverlayHtml, isDemoPage } from "@/lib/build/demoOverlay";

/**
 * GET /build/overlay/gaming (… v-gaming, starting-soon, brb, ending) — the
 * real overlay page in demo mode for the public /build page (see
 * lib/build/demoOverlay.ts). Read from our own /overlay/ files, so the demo
 * is always the overlay that's on stream.
 */
export async function GET(request: Request, ctx: { params: Promise<{ file: string }> }) {
  await connection();
  const { file } = await ctx.params;
  if (!isDemoPage(file)) return new Response("Not found", { status: 404 });
  const res = await fetch(new URL(`/overlay/${file}.html`, request.url), { cache: "no-store" });
  if (!res.ok) return new Response("Not found", { status: 404 });
  return new Response(demoOverlayHtml(await res.text()), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Changes only with a deploy; an hour at the CDN keeps it free.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
