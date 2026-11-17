import "server-only";
import { cookies } from "next/headers";
import { adminSecrets, SESSION_COOKIE, verifySession } from "./session";

/** `true` when the current request carries a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const secrets = adminSecrets();
  if (!secrets) return false;
  const store = await cookies();
  return verifySession(secrets.secret, store.get(SESSION_COOKIE)?.value, Date.now());
}
