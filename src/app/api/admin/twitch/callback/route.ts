import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, finishTwitchConnect, sameState } from "@/lib/stream/connections";

/** GET /api/admin/twitch/callback — Twitch sends Frank back here after the login. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const back = (result: string) => {
    const res = NextResponse.redirect(`${origin}/admin?connect=${result}`);
    res.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/admin" });
    return res;
  };
  // The admin cookie is SameSite=Strict, so it isn't sent on this redirect
  // from Twitch/Google. The one-time state cookie, set only by the admin-only
  // /connect route, proves this login was started from the control room.
  const saved = (await cookies()).get(OAUTH_STATE_COOKIE)?.value;
  const code = url.searchParams.get("code");
  if (!code || !sameState(saved, url.searchParams.get("state"))) return back("twitch-cancelled");
  try {
    await finishTwitchConnect(code, origin);
    return back("twitch-ok");
  } catch (error) {
    console.error("[twitch] connect failed", error);
    return back("twitch-failed");
  }
}
