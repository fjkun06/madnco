/**
 * @jest-environment node
 */
import {
  SESSION_MS,
  adminSecrets,
  passwordMatches,
  safeEqual,
  signSession,
  verifySession,
} from "./session";

const SECRET = "a-long-test-secret-for-signing";
const NOW = 1_800_000_000_000;

describe("admin session", () => {
  it("accepts its own fresh session", async () => {
    const value = await signSession(SECRET, NOW);
    await expect(verifySession(SECRET, value, NOW + 1000)).resolves.toBe(true);
  });

  it("rejects expired, tampered, foreign and missing sessions", async () => {
    const value = await signSession(SECRET, NOW);
    await expect(verifySession(SECRET, value, NOW + SESSION_MS + 1)).resolves.toBe(false);
    const [expires, sig] = value.split(".");
    await expect(
      verifySession(SECRET, `${Number(expires) + 1}.${sig}`, NOW),
    ).resolves.toBe(false);
    await expect(verifySession("other-secret", value, NOW)).resolves.toBe(false);
    await expect(verifySession(SECRET, undefined, NOW)).resolves.toBe(false);
    await expect(verifySession(SECRET, "garbage", NOW)).resolves.toBe(false);
  });

  it("checks the password", async () => {
    await expect(passwordMatches("hunter22", "hunter22")).resolves.toBe(true);
    await expect(passwordMatches("hunter2", "hunter22")).resolves.toBe(false);
    await expect(passwordMatches("", "")).resolves.toBe(false);
  });

  it("compares strings safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("needs a password of at least 8 characters", () => {
    const before = { ...process.env };
    process.env.ADMIN_PASSWORD = "short";
    expect(adminSecrets()).toBeNull();
    process.env.ADMIN_PASSWORD = "long-enough";
    delete process.env.ADMIN_SESSION_SECRET;
    expect(adminSecrets()).toEqual({ password: "long-enough", secret: "long-enough" });
    process.env = before;
  });
});
