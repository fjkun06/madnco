import { connection } from "next/server";
import { parseSharePath, shareCard, sharePage, shareTarget } from "@/lib/stream/share";
import { loadPublicStatus } from "@/lib/stream/store";
import { siteConfig } from "@/utils/app.constants";

/**
 * GET /live, /live/tiktok, /live/twitch, /live/youtube — share links with
 * MadnCo.'s own preview card. Chat apps read the tags; people get forwarded
 * to the live page straight away.
 */
export async function GET(request: Request, ctx: { params: Promise<{ platform?: string[] }> }) {
  await connection();
  const choice = parseSharePath((await ctx.params).platform);
  if (!choice) return new Response("Not found", { status: 404 });
  const status = await loadPublicStatus();
  const target = shareTarget(status, choice);
  const card = shareCard(status, target.platform, Date.now());
  const { search } = new URL(request.url);
  const path = choice === "auto" ? "/live" : `/live/${choice}`;
  return new Response(sharePage(card, target, `${siteConfig.url}${path}${search}`), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Short CDN cache: a preview fetch per share stays cheap, LIVE flips fast.
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
      "X-Robots-Tag": "noindex",
    },
  });
}
