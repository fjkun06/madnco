import { createHmac } from "node:crypto";
import { validEventSub } from "./eventsub";
import {
  ALERT_TTL_MS,
  FOUNDERS_MAX,
  cleanFanName,
  fanKey,
  liveAlerts,
  newAlertId,
  parseAlert,
  parseFounder,
  publicFans,
  type Alert,
} from "./fans";

const NOW = Date.UTC(2026, 10, 20, 20, 0, 0);

describe("names", () => {
  it("cleans handles and keeps display names", () => {
    expect(cleanFanName("kevin_98")).toBe("@kevin_98");
    expect(cleanFanName("  @Lena.mp4 ")).toBe("@Lena.mp4");
    expect(cleanFanName("Lena Müller")).toBe("Lena Müller");
    expect(cleanFanName("")).toBe("");
    expect(cleanFanName(42)).toBe("");
    expect(fanKey("@Kevin_98")).toBe(fanKey("kevin_98"));
  });
});

describe("parsing stored values", () => {
  it("reads founders from Redis strings and drops junk", () => {
    expect(parseFounder(JSON.stringify({ name: "kevin", platform: "tiktok", at: 5 }))).toEqual({
      name: "@kevin",
      platform: "tiktok",
      at: 5,
    });
    expect(parseFounder(JSON.stringify({ name: "x", platform: "myspace" }))?.platform).toBe("other");
    expect(parseFounder("{nope")).toBeNull();
    expect(parseFounder(JSON.stringify({ name: "" }))).toBeNull();
  });

  it("reads alerts and caps the founder number", () => {
    const a = parseAlert(JSON.stringify({ id: "a", kind: "follow", name: "kev", platform: "twitch", n: 28, at: NOW }));
    expect(a).toEqual({ id: "a", kind: "follow", name: "@kev", platform: "twitch", n: 28, at: NOW });
    expect(parseAlert({ id: "b", kind: "follow", name: "", platform: "tiktok", n: 77, at: NOW })?.n).toBeNull();
    expect(parseAlert({ id: "c", kind: "boom", at: NOW })).toBeNull();
    expect(parseAlert({ kind: "welcome", at: NOW })).toBeNull();
  });
});

describe("what the overlays get", () => {
  const alert = (id: string, at: number): Alert => ({ id, kind: "follow", name: "@x", platform: "tiktok", n: null, at });

  it("keeps only recent alerts, oldest first", () => {
    const list = [alert("new", NOW - 1000), alert("old", NOW - ALERT_TTL_MS - 1), alert("mid", NOW - 5000)];
    expect(liveAlerts(list, NOW).map((a) => a.id)).toEqual(["mid", "new"]);
  });

  it("shows at most 50 founders, without timestamps", () => {
    const founders = Array.from({ length: 60 }, (_, i) => ({ name: `@f${i}`, platform: "tiktok" as const, at: i }));
    const fans = publicFans(founders, [], NOW);
    expect(fans.founders).toHaveLength(FOUNDERS_MAX);
    expect(fans.founders[0]).toEqual({ name: "@f0", platform: "tiktok" });
    expect(fans.goal).toBe(50);
  });

  it("makes short unique-ish alert ids", () => {
    expect(newAlertId(NOW, () => 0.5)).toBe(`${NOW.toString(36)}${(500000).toString(36)}`);
  });
});

describe("Twitch EventSub signature", () => {
  const secret = "a-long-test-secret";
  const id = "msg-1";
  const timestamp = new Date(NOW).toISOString();
  const body = '{"subscription":{"type":"channel.follow"}}';
  const sign = (s: string) =>
    "sha256=" + createHmac("sha256", s).update(id + timestamp + body).digest("hex");

  it("accepts Twitch's signature and nothing else", () => {
    expect(validEventSub(secret, { id, timestamp, signature: sign(secret) }, body, NOW)).toBe(true);
    expect(validEventSub(secret, { id, timestamp, signature: sign("wrong-secret") }, body, NOW)).toBe(false);
    expect(validEventSub(secret, { id, timestamp, signature: sign(secret) }, body + " ", NOW)).toBe(false);
    expect(validEventSub(null, { id, timestamp, signature: sign(secret) }, body, NOW)).toBe(false);
  });

  it("refuses old messages (replays)", () => {
    expect(
      validEventSub(secret, { id, timestamp, signature: sign(secret) }, body, NOW + 11 * 60_000),
    ).toBe(false);
  });
});
