/**
 * The "we're live on TikTok" ping for Discord: the webhook body, built from
 * the saved stream info. Pure, so it is unit-tested; sending happens in
 * /api/admin/discord.
 */

import { siteConfig } from "@/utils/app.constants";
import type { StreamState } from "./state";

/** Which TikTok account is live. */
export type TikTokAccount = "live" | "main";

/** Seconds the button stays locked after a send (no double pings). */
export const DISCORD_LOCK_SECONDS = 10 * 60;

/** Brand turquoise as a Discord embed colour. */
const EMBED_COLOR = 0x30d5c8;

export function tiktokHandle(account: TikTokAccount): string {
  return account === "main" ? siteConfig.handles.tiktok : siteConfig.handles.tiktokLive;
}

export function tiktokLiveUrl(account: TikTokAccount): string {
  return `https://www.tiktok.com/${tiktokHandle(account)}/live`;
}

/** A Discord webhook URL, and nothing else, may be called. */
export function isWebhookUrl(value: string | undefined): value is string {
  return Boolean(
    value &&
    /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(
      value,
    ),
  );
}

/**
 * The webhook body. Only the Live Ping role may be mentioned, so a topic
 * like "@everyone" can never ping the whole server.
 */
export function discordMessage(
  state: Pick<StreamState, "topic" | "game">,
  account: TikTokAccount,
  roleId: string | undefined,
) {
  const role = roleId && /^\d{5,25}$/.test(roleId) ? roleId : null;
  const handle = tiktokHandle(account);
  const url = tiktokLiveUrl(account);
  return {
    username: "MadnCo. Live",
    content: `${role ? `<@&${role}> ` : ""}we're LIVE on TikTok 🔴`,
    allowed_mentions: { parse: [], roles: role ? [role] : [] },
    embeds: [
      {
        title: state.topic || `${siteConfig.name} is live`,
        description: [state.game, `on ${handle}`].filter(Boolean).join(" · "),
        url,
        color: EMBED_COLOR,
        footer: { text: siteConfig.url.replace(/^https:\/\/(www\.)?/, "") },
      },
    ],
  };
}
