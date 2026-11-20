import "server-only";
import { siteConfig } from "@/utils/app.constants";
import { getJSON, setJSON } from "./redis";

/**
 * Is @madnco8 live on Twitch? Asked through the Helix API with an app token
 * (client credentials, no user login) and cached in Redis for a minute, so
 * the website and every overlay share one answer and Twitch gets about one
 * request a minute at most.
 */

const TOKEN_KEY = "madnco:twitch:token";
const STATUS_KEY = "madnco:twitch:status";
const STATUS_TTL = 60;

export type TwitchStatus = { live: boolean; game: string };

export function twitchCredentials() {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

/** The channel login, from TWITCH_LOGIN or the handle in siteConfig. */
export function twitchLogin(): string {
  return (process.env.TWITCH_LOGIN ?? siteConfig.handles.twitch)
    .replace(/^@/, "")
    .toLowerCase();
}

export async function twitchAppToken(id: string, secret: string): Promise<string> {
  const cached = await getJSON<string>(TOKEN_KEY);
  if (cached) return cached;
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Twitch token failed: ${res.status}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  // Keep a margin so a token is never used in its last minutes.
  await setJSON(TOKEN_KEY, body.access_token, Math.max(60, body.expires_in - 600));
  return body.access_token;
}

/**
 * The cached Twitch status, or `null` when it can't be known (no
 * credentials, or Twitch/Redis failed). Never throws.
 */
export async function twitchStatus(): Promise<TwitchStatus | null> {
  const creds = twitchCredentials();
  if (!creds) return null;
  try {
    const cached = await getJSON<TwitchStatus>(STATUS_KEY);
    if (cached) return cached;
    const token = await twitchAppToken(creds.id, creds.secret);
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(twitchLogin())}`,
      {
        headers: { "Client-Id": creds.id, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Twitch streams failed: ${res.status}`);
    const body = (await res.json()) as { data?: { type?: string; game_name?: string }[] };
    const stream = body.data?.[0];
    const status: TwitchStatus = {
      live: stream?.type === "live",
      game: stream?.game_name ?? "",
    };
    await setJSON(STATUS_KEY, status, STATUS_TTL);
    return status;
  } catch (error) {
    console.error("[twitch]", error);
    return null;
  }
}
