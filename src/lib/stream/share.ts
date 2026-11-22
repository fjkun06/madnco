import { siteConfig } from "@/utils/app.constants";
import type { PublicStatus } from "./state";

/**
 * Share links: madnco.frankjordan.dev/live/tiktok (twitch, youtube, or just
 * /live) answer with a tiny page whose link preview is MadnCo.'s own card
 * (the game's screenshot, LIVE chip, play button) and then forward people to
 * the real live page. WhatsApp, Discord, iMessage and X read the preview from
 * this page, so TikTok's dark default image never shows.
 */
export const SHARE_PLATFORMS = ["tiktok", "twitch", "youtube"] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];
export type ShareChoice = SharePlatform | "auto";

export const PLATFORM_LABEL: Record<SharePlatform, string> = {
  tiktok: "TikTok",
  twitch: "Twitch",
  youtube: "YouTube",
};

type ShareStatus = Pick<PublicStatus, "live" | "topic" | "next" | "play" | "channels">;

/** `/live` → "auto", `/live/tiktok` → "tiktok", anything else → `null` (404). */
export function parseSharePath(segments: readonly string[] | undefined): ShareChoice | null {
  if (!segments || segments.length === 0) return "auto";
  if (segments.length > 1) return null;
  const value = segments[0].toLowerCase();
  return (SHARE_PLATFORMS as readonly string[]).includes(value) ? (value as SharePlatform) : null;
}

/** Where the link sends people, and whose channel that is. */
export function shareTarget(
  status: Pick<PublicStatus, "channels">,
  choice: ShareChoice,
): { platform: SharePlatform; href: string; handle: string } {
  const landscape = status.channels?.landscape;
  const vertical = status.channels?.vertical;
  // Same rule as the website's Live button: Twitch, or the borrowed YouTube.
  const platform: SharePlatform = choice !== "auto" ? choice : landscape?.guest ? "youtube" : "twitch";
  switch (platform) {
    case "tiktok":
      return vertical?.guest
        ? { platform, href: vertical.url, handle: vertical.host }
        : { platform, href: `${siteConfig.links.tiktok}/live`, handle: siteConfig.handles.tiktok };
    case "youtube":
      return landscape?.guest
        ? { platform, href: landscape.url, handle: landscape.host }
        : { platform, href: `${siteConfig.links.youtube}/live`, handle: siteConfig.handles.youtube };
    default:
      return { platform, href: siteConfig.links.twitch, handle: siteConfig.handles.twitch };
  }
}

const NEXT_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export type ShareCard = { title: string; description: string; image: string; imageType: string; alt: string };

/** The preview: title, description and image for one platform. */
export function shareCard(status: ShareStatus, platform: SharePlatform, now: number): ShareCard {
  const play = status.play;
  const { handle } = shareTarget(status, platform);
  const label = PLATFORM_LABEL[platform];
  const headline = play?.goal || play?.name || status.topic || siteConfig.name;
  const title = status.live ? `🔴 LIVE: ${headline}` : `${headline} · ${siteConfig.name}`;

  const facts: string[] = [];
  if (play) {
    if (play.goal) facts.push(play.name);
    if (play.part !== null) facts.push(`${play.unit} ${play.part}`);
    for (const c of play.counters) {
      facts.push(c.total ? `${c.label} ${c.value}/${c.total}` : `${c.label} ${c.value}`);
    }
    if (play.widget === "football" && play.football.record) {
      facts.push(`W-D-L ${play.football.w}-${play.football.d}-${play.football.l}`);
    }
  }
  const action = status.live
    ? `Tap to watch on ${label} (${handle})`
    : status.next && status.next.at > now
      ? `Next stream: ${NEXT_FORMAT.format(status.next.at)} on ${label}`
      : `Follow ${handle} on ${label}`;

  const art = play?.art ?? null;
  const image = art ? (status.live ? art[platform] : art.off) : `${siteConfig.url}/og-image.png`;
  return {
    title,
    description: [...facts, action].join(" · "),
    image,
    imageType: art ? "image/jpeg" : "image/png",
    alt: play ? `${play.name}: ${siteConfig.name} ${status.live ? "live now" : "stream"}` : siteConfig.slogan,
  };
}

/** The link the Control Room copies; `s` changes each time so apps fetch a fresh preview. */
export function shareUrl(choice: ShareChoice, now: number): string {
  const path = choice === "auto" ? "/live" : `/live/${choice}`;
  return `${siteConfig.url}${path}?s=${Math.floor(now / 1000).toString(36)}`;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** The whole share page: preview tags, then a redirect for people. */
export function sharePage(card: ShareCard, target: { href: string; platform: SharePlatform }, pageUrl: string): string {
  const e = escapeHtml;
  const label = PLATFORM_LABEL[target.platform];
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(card.title)}</title>
<meta name="description" content="${e(card.description)}">
<meta name="robots" content="noindex, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(siteConfig.name)}">
<meta property="og:url" content="${e(pageUrl)}">
<meta property="og:title" content="${e(card.title)}">
<meta property="og:description" content="${e(card.description)}">
<meta property="og:image" content="${e(card.image)}">
<meta property="og:image:secure_url" content="${e(card.image)}">
<meta property="og:image:type" content="${e(card.imageType)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(card.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(card.title)}">
<meta name="twitter:description" content="${e(card.description)}">
<meta name="twitter:image" content="${e(card.image)}">
<meta http-equiv="refresh" content="0;url=${e(target.href)}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#110A0C;color:#F4EFE6;font:600 18px system-ui,sans-serif;text-align:center}a{display:inline-block;margin-top:16px;padding:14px 22px;background:#FF4D4D;color:#110A0C;text-decoration:none;font-weight:800}</style>
</head><body><main><p>Opening ${e(label)}…</p><a href="${e(target.href)}">Watch on ${e(label)}</a></main></body></html>`;
}
