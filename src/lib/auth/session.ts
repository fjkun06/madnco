/**
 * Admin login without a user table: one password (ADMIN_PASSWORD) and a
 * signed, expiring session cookie. Uses Web Crypto only, so it runs in
 * Node and on the edge and needs no npm package.
 *
 * Cookie value: `<expiresAtMs>.<hmacSha256Base64Url(expiresAtMs)>`.
 */

export const SESSION_COOKIE = "madnco_admin";
export const SESSION_DAYS = 7;
export const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Compare two strings in time that doesn't depend on where they differ. */
export function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** A signed session value that expires `SESSION_MS` after `now`. */
export async function signSession(secret: string, now: number): Promise<string> {
  const expires = String(now + SESSION_MS);
  return `${expires}.${await hmac(secret, expires)}`;
}

/** `true` for an untampered session value that hasn't expired. */
export async function verifySession(
  secret: string,
  value: string | undefined,
  now: number,
): Promise<boolean> {
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) <= now) return false;
  return safeEqual(signature, await hmac(secret, expires));
}

/**
 * Compare the typed password with the expected one. Both are hashed first,
 * so the comparison takes the same time whatever their lengths.
 */
export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const [a, b] = await Promise.all([hmac("pw", input), hmac("pw", expected)]);
  return safeEqual(a, b);
}

/** Secrets from the environment; `null` when the admin isn't set up. */
export function adminSecrets(): { password: string; secret: string } | null {
  const password = process.env.ADMIN_PASSWORD ?? "";
  // A separate secret lets you sign everyone out by changing it alone.
  const secret = process.env.ADMIN_SESSION_SECRET || password;
  return password.length >= 8 ? { password, secret } : null;
}
