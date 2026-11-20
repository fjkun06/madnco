import { handleEventSub, validTwitchMessage } from "@/lib/stream/connections";
import { redisConfigured } from "@/lib/stream/redis";

/**
 * POST /api/twitch/eventsub — Twitch calls this for every new follow
 * (EventSub webhook). Only messages signed with TWITCH_EVENTSUB_SECRET count.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const h = request.headers;
  const id = h.get("twitch-eventsub-message-id");
  if (
    !validTwitchMessage(
      {
        id,
        timestamp: h.get("twitch-eventsub-message-timestamp"),
        signature: h.get("twitch-eventsub-message-signature"),
      },
      body,
    )
  ) {
    return new Response("forbidden", { status: 403 });
  }
  if (!redisConfigured()) return new Response("storage not configured", { status: 503 });
  let payload: Parameters<typeof handleEventSub>[2] = {};
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("bad json", { status: 400 });
  }
  try {
    const res = await handleEventSub(h.get("twitch-eventsub-message-type"), id!, payload);
    return new Response(res.body || null, {
      status: res.status,
      headers: res.contentType ? { "Content-Type": res.contentType } : undefined,
    });
  } catch (error) {
    console.error("[eventsub] failed", error);
    return new Response("failed", { status: 500 });
  }
}
