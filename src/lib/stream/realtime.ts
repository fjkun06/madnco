import { loadPublicStatus } from "./store";

/**
 * Realtime overlays (Ably, free plan). After every change — Remote taps,
 * Games tab, Save & push, Stream Deck, follows — the server publishes the
 * new public status on one channel; the OBS overlays listen over Ably's SSE
 * endpoint and redraw within ~0.5 s instead of waiting for their next poll.
 *
 * Env (both optional; without them the overlays just poll as before):
 *   ABLY_API_KEY        root key ("appId.keyId:secret"), server only
 *   ABLY_SUBSCRIBE_KEY  a second key with only "subscribe" on this channel;
 *                       public on purpose (it can listen, not send)
 */
export const REALTIME_CHANNEL = "madnco-stream";

const ABLY_REST = "https://main.realtime.ably.net";
/** Ably's default message limit is 64 KB; stay under it with room to spare. */
const MAX_BYTES = 60_000;
/** Who the server publishes as. */
const CLIENT_ID = "madnco-server";

/** What /api/stream tells the overlays, or `null` when realtime is off. */
export function realtimePublic(): { key: string; channel: string } | null {
  const key = process.env.ABLY_SUBSCRIBE_KEY?.trim();
  return key && process.env.ABLY_API_KEY ? { key, channel: REALTIME_CHANNEL } : null;
}

/**
 * Push the current public status to the overlays. Never throws: if Ably is
 * down or not set up, the overlays' backup polling still catches up.
 * Run it with `after()` so the admin's answer isn't delayed.
 */
export async function publishStatus(): Promise<void> {
  const key = process.env.ABLY_API_KEY?.trim();
  if (!key) return;
  try {
    const data = JSON.stringify(await loadPublicStatus());
    if (Buffer.byteLength(data) > MAX_BYTES) {
      console.error("[realtime] status too big to push", Buffer.byteLength(data));
      return;
    }
    const res = await fetch(`${ABLY_REST}/channels/${REALTIME_CHANNEL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(key).toString("base64")}`,
        // Basic auth may claim a client ID (Base64, per Ably's REST spec), so
        // channels that require identified clients accept it (error 40161).
        "X-Ably-ClientId": Buffer.from(CLIENT_ID).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "status", data, clientId: CLIENT_ID }),
      cache: "no-store",
    });
    // Shows in Vercel → Logs (search "realtime"); polling still covers it.
    if (!res.ok) console.error("[realtime] publish failed", res.status, (await res.text()).slice(0, 300));
  } catch (error) {
    console.error("[realtime] publish failed", error);
  }
}
