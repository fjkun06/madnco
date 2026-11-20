import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Is this really Twitch? EventSub signs every webhook message with
 * HMAC-SHA256(secret, message id + timestamp + raw body). Messages older
 * than 10 minutes are refused too (replays).
 */
export function validEventSub(
  secret: string | null,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  now = Date.now(),
): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const sent = Date.parse(headers.timestamp);
  if (!Number.isFinite(sent) || Math.abs(now - sent) > 10 * 60_000) return false;
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(headers.id + headers.timestamp + body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(headers.signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
