import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MS,
  adminSecrets,
  passwordMatches,
  signSession,
} from "@/lib/auth/session";
import { hit, redisConfigured } from "@/lib/stream/redis";

/** At most this many login attempts per IP in `WINDOW` seconds. */
const MAX_ATTEMPTS = 10;
const WINDOW = 10 * 60;

/** POST /api/admin/login — `{ password }` → session cookie. */
export async function POST(request: Request) {
  const secrets = adminSecrets();
  if (!secrets) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  if (redisConfigured()) {
    const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    try {
      if ((await hit(`madnco:login:${ip}`, WINDOW)) > MAX_ATTEMPTS) {
        return NextResponse.json({ error: "too-many" }, { status: 429 });
      }
    } catch {
      // Rate limiting is best effort; never lock the owner out over it.
    }
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  if (!(await passwordMatches(password, secrets.password))) {
    return NextResponse.json({ error: "wrong-password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await signSession(secrets.secret, Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
  return response;
}
