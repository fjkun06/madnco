import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { validEventSub } from "./eventsub";
import { addFollower } from "./fanStore";
import { getJSON, redis, setJSON } from "./redis";
import { twitchAppToken, twitchCredentials } from "./twitch";

/**
 * Connection to Twitch for automatic follow alerts.
 *
 * Twitch: Frank logs in once (scope moderator:read:followers), we create an
 * EventSub "channel.follow" webhook, and Twitch calls /api/twitch/eventsub on
 * every new follow. No user token is kept.
 */

export const OAUTH_STATE_COOKIE = "madnco_oauth_state";

const TWITCH_CONN = "madnco:conn:twitch";

export type TwitchConnection = {
  login: string;
  id: string;
  status: "pending" | "enabled" | "revoked" | "failed";
  at: number;
};

export const newOAuthState = () => randomBytes(18).toString("base64url");

export function sameState(a: string | undefined | null, b: string | undefined | null) {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------- Twitch

export const twitchCallbackUrl = (origin: string) => `${origin}/api/admin/twitch/callback`;
export const eventSubUrl = (origin: string) => `${origin}/api/twitch/eventsub`;

function eventSubSecret(): string | null {
  const secret = process.env.TWITCH_EVENTSUB_SECRET ?? "";
  return secret.length >= 10 && secret.length <= 100 ? secret : null;
}

export function twitchReadyToConnect(): boolean {
  return twitchCredentials() !== null && eventSubSecret() !== null;
}

export function twitchAuthUrl(origin: string, state: string): string | null {
  const creds = twitchCredentials();
  if (!creds) return null;
  const q = new URLSearchParams({
    client_id: creds.id,
    redirect_uri: twitchCallbackUrl(origin),
    response_type: "code",
    scope: "moderator:read:followers",
    state,
  });
  return `https://id.twitch.tv/oauth2/authorize?${q}`;
}

/** After the login: who logged in, then the follow webhook. Throws with a short reason. */
export async function finishTwitchConnect(code: string, origin: string): Promise<TwitchConnection> {
  const creds = twitchCredentials();
  const secret = eventSubSecret();
  if (!creds || !secret) throw new Error("twitch-not-configured");
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.id,
      client_secret: creds.secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: twitchCallbackUrl(origin),
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`twitch-token-${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch("https://api.twitch.tv/helix/users", {
    headers: { "Client-Id": creds.id, Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!userRes.ok) throw new Error(`twitch-user-${userRes.status}`);
  const user = ((await userRes.json()) as { data: { id: string; login: string }[] }).data[0];
  if (!user) throw new Error("twitch-user-missing");

  // The webhook is created with an app token; Twitch accepts it because the
  // channel owner has just granted moderator:read:followers to this app.
  const app = await twitchAppToken(creds.id, creds.secret);
  const subRes = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      "Client-Id": creds.id,
      Authorization: `Bearer ${app}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "channel.follow",
      version: "2",
      condition: { broadcaster_user_id: user.id, moderator_user_id: user.id },
      transport: { method: "webhook", callback: eventSubUrl(origin), secret },
    }),
    cache: "no-store",
  });
  // 409 = it already exists: fine.
  if (!subRes.ok && subRes.status !== 409) throw new Error(`twitch-eventsub-${subRes.status}`);
  const conn: TwitchConnection = {
    login: user.login,
    id: user.id,
    status: subRes.status === 409 ? "enabled" : "pending",
    at: Date.now(),
  };
  await setJSON(TWITCH_CONN, conn);
  return conn;
}

export const loadTwitchConnection = () => getJSON<TwitchConnection>(TWITCH_CONN);

/** Twitch's signature check with our secret (see eventsub.ts). */
export function validTwitchMessage(
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
): boolean {
  return validEventSub(eventSubSecret(), headers, body);
}

/** Handle one verified EventSub message; returns the response body. */
export async function handleEventSub(
  type: string | null,
  messageId: string,
  payload: {
    challenge?: string;
    subscription?: { type?: string; status?: string };
    event?: { user_name?: string; user_login?: string };
  },
): Promise<{ status: number; body: string; contentType?: string }> {
  // Twitch may resend: handle each message once.
  const first = await redis<string | null>(["SET", `madnco:es:${messageId}`, "1", "NX", "EX", 900]);
  if (first === null && type !== "webhook_callback_verification") return { status: 204, body: "" };

  if (type === "webhook_callback_verification") {
    const conn = await loadTwitchConnection();
    if (conn) await setJSON(TWITCH_CONN, { ...conn, status: "enabled" });
    return { status: 200, body: payload.challenge ?? "", contentType: "text/plain" };
  }
  if (type === "revocation") {
    const conn = await loadTwitchConnection();
    if (conn) await setJSON(TWITCH_CONN, { ...conn, status: "revoked" });
    return { status: 204, body: "" };
  }
  if (type === "notification" && payload.subscription?.type === "channel.follow") {
    const name = payload.event?.user_name || payload.event?.user_login || "";
    await addFollower({ name, platform: "twitch" });
  }
  return { status: 204, body: "" };
}
