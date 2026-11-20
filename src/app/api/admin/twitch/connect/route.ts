import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { OAUTH_STATE_COOKIE, newOAuthState, twitchAuthUrl, twitchReadyToConnect } from "@/lib/stream/connections";

/** GET /api/admin/twitch/connect — off to Twitch to allow follow alerts. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!(await isAdmin())) return NextResponse.redirect(`${origin}/admin`);
  const state = newOAuthState();
  const url = twitchReadyToConnect() ? twitchAuthUrl(origin, state) : null;
  if (!url) return NextResponse.redirect(`${origin}/admin?connect=twitch-not-configured`);
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/admin",
    maxAge: 600,
  });
  return res;
}
