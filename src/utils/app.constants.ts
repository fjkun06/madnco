/**
 * MadnCo. — the single source of truth for every handle, link and number on
 * the site. Unconfirmed facts are `[...]` placeholders (see `isPlaceholder`),
 * never guesses: components show them visibly instead of linking.
 */

export const siteConfig = {
  name: "MadnCo.",
  slogan: "The duo of endless madness",
  /** Final URL with www (Vercel primary domain); also metadataBase. */
  url: "https://www.madnco.frankjordan.dev",
  /** Mad's own site, credited in the footer. */
  builderUrl: "https://frankjordan.dev",
  links: {
    discord: "[DISCORD INVITE LINK]",
    tiktok: "https://www.tiktok.com/@madnco8",
    /** MadnCo. goes live here until @madnco8 unlocks TikTok LIVE. */
    tiktokLive: "https://www.tiktok.com/@clipzhub06",
    twitch: "[TWITCH LINK]",
    youtube: "[YOUTUBE LINK]",
  },
  handles: {
    tiktok: "@madnco8",
    tiktokLive: "@clipzhub06",
    twitch: "[TWITCH HANDLE]",
    youtube: "[YOUTUBE HANDLE]",
  },
  animeCaseFiles: {
    name: "The Anime Case Files",
    tiktok: "https://www.tiktok.com/@theanimecasefiles",
    youtube: "[ANIME CASE FILES YOUTUBE LINK]",
  },
  /** TikTok's follower minimum before an account may go LIVE. */
  liveFollowerGoal: 50,
  /**
   * Current @madnco8 follower count, updated by hand. `null` until known:
   * the side quest bar then stays empty and shows a placeholder.
   */
  madncoFollowers: null as number | null,
} as const;

/** `true` for an unconfirmed fact written as `[...]`. */
export function isPlaceholder(value: string): boolean {
  return /^\[.*\]$/.test(value.trim());
}

/** The link if it is confirmed, otherwise `undefined` (render it unlinked). */
export function confirmedHref(value: string): string | undefined {
  return isPlaceholder(value) ? undefined : value;
}

/**
 * Share of the follower goal reached, 0–1, for the side quest XP bar.
 * Unknown counts give 0; anything past the goal is capped at 1.
 */
export function followerProgress(followers: number | null, goal: number): number {
  if (followers === null || goal <= 0) return 0;
  return Math.min(1, Math.max(0, followers / goal));
}
