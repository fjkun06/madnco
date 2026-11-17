import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import {
  DISCORD_LOCK_SECONDS,
  discordMessage,
  isWebhookUrl,
  type TikTokAccount,
} from "@/lib/stream/discord";
import { redis, redisConfigured } from "@/lib/stream/redis";
import { loadState } from "@/lib/stream/store";

/** When the last ping went out (epoch ms); expires with the lock. */
const LOCK_KEY = "madnco:discord:last";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

function webhook(): string | null {
  const url = process.env.DISCORD_WEBHOOK_URL;
  return isWebhookUrl(url) ? url : null;
}

async function lastSent(): Promise<number | null> {
  if (!redisConfigured()) return null;
  const raw = await redis<string | null>(["GET", LOCK_KEY]).catch(() => null);
  return raw ? Number(raw) || null : null;
}

/** GET /api/admin/discord — is the ping set up, and when was it last sent. */
export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const sentAt = await lastSent();
  return NextResponse.json(
    {
      configured: webhook() !== null,
      lastSentAt: sentAt,
      lockedUntil: sentAt ? sentAt + DISCORD_LOCK_SECONDS * 1000 : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * POST /api/admin/discord — post the TikTok LIVE ping (admin only).
 * Body: { account: "live" | "main" }. Locked for 10 minutes after a send.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "json-only" }, { status: 415 });
  }
  const url = webhook();
  if (!url)
    return NextResponse.json({ error: "discord-not-configured" }, { status: 503 });
  if (!redisConfigured()) {
    return NextResponse.json({ error: "storage-not-configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { account?: unknown };
  const account: TikTokAccount = body.account === "main" ? "main" : "live";

  // Take the lock first, so two quick taps can't send twice.
  const now = Date.now();
  const locked = await redis<string | null>([
    "SET",
    LOCK_KEY,
    String(now),
    "NX",
    "EX",
    DISCORD_LOCK_SECONDS,
  ]);
  if (locked !== "OK") {
    const sentAt = await lastSent();
    return NextResponse.json(
      {
        error: "discord-locked",
        lockedUntil: sentAt ? sentAt + DISCORD_LOCK_SECONDS * 1000 : null,
      },
      { status: 429 },
    );
  }

  try {
    const state = await loadState();
    const res = await fetch(`${url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        discordMessage(state, account, process.env.DISCORD_LIVE_ROLE_ID),
      ),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Discord answered ${res.status}`);
  } catch (error) {
    console.error("[admin] discord ping failed", error);
    // Free the button again: nothing went out.
    await redis(["DEL", LOCK_KEY]).catch(() => undefined);
    return NextResponse.json({ error: "discord-failed" }, { status: 502 });
  }

  return NextResponse.json(
    { lastSentAt: now, lockedUntil: now + DISCORD_LOCK_SECONDS * 1000 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
