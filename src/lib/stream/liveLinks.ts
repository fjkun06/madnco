import { siteConfig } from "@/utils/app.constants";
import type { PublicStatus } from "./state";

/**
 * Where the site's Live buttons point. Live: Twitch, or the borrowed YouTube
 * channel while the landscape scenes are in Guest mode. Offline: where the
 * TikTok lives happen (the guest account until @madnco8 can go LIVE).
 */
export function liveLinks(status: Pick<PublicStatus, "channels"> | null | undefined): {
  live: { href: string; host: string | null };
  lives: { href: string; handle: string };
} {
  const ch = status?.channels;
  const landscape = ch?.landscape;
  const vertical = ch?.vertical;
  return {
    live:
      landscape?.guest
        ? { href: landscape.url, host: landscape.host }
        : { href: siteConfig.links.twitch, host: null },
    lives: vertical
      ? vertical.guest
        ? { href: `https://www.tiktok.com/${vertical.host}`, handle: vertical.host }
        : { href: siteConfig.links.tiktok, handle: siteConfig.handles.tiktok }
      : { href: siteConfig.links.tiktokLive, handle: siteConfig.handles.tiktokLive },
  };
}
