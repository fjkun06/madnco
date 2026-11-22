import { newProfile, publicPlay, sanitizeArt, type ShareArt } from "./games";
import { parseSharePath, shareCard, sharePage, shareTarget, shareUrl } from "./share";
import { OFFLINE_STATUS } from "./state";

const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const BLOB = "https://abc123.public.blob.vercel-storage.com/share/god-of-war";
const ART: ShareArt = {
  tiktok: `${BLOB}/a-tiktok-x1.jpg`,
  twitch: `${BLOB}/a-twitch-x1.jpg`,
  youtube: `${BLOB}/a-youtube-x1.jpg`,
  off: `${BLOB}/a-off-x1.jpg`,
};

const gow = {
  ...newProfile("God of War", [], "story"),
  goal: "Un débutant peut-il battre God of War ?",
  art: ART,
};

const status = (patch: Partial<typeof OFFLINE_STATUS> = {}) => ({
  ...OFFLINE_STATUS,
  play: publicPlay(gow, { part: 2, c1: 47, c2: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, mins: 0 }),
  ...patch,
});

describe("share paths", () => {
  it("knows /live and the three platforms, nothing else", () => {
    expect(parseSharePath(undefined)).toBe("auto");
    expect(parseSharePath([])).toBe("auto");
    expect(parseSharePath(["TikTok"])).toBe("tiktok");
    expect(parseSharePath(["twitch"])).toBe("twitch");
    expect(parseSharePath(["insta"])).toBeNull();
    expect(parseSharePath(["tiktok", "x"])).toBeNull();
  });

  it("adds a changing ending so chat apps fetch a new preview", () => {
    expect(shareUrl("tiktok", NOW)).toMatch(/^https:\/\/www\.madnco\.frankjordan\.dev\/live\/tiktok\?s=[a-z0-9]+$/);
    expect(shareUrl("auto", NOW)).toMatch(/\/live\?s=/);
    expect(shareUrl("auto", NOW)).not.toBe(shareUrl("auto", NOW + 60_000));
  });
});

describe("shareTarget", () => {
  it("sends TikTok links to the guest account while vertical is in Guest mode", () => {
    const s = status();
    const guest = { ...s.channels, vertical: { guest: true, host: "@clipzhub06", url: "https://www.tiktok.com/@clipzhub06/live" } };
    expect(shareTarget({ channels: guest }, "tiktok")).toEqual({
      platform: "tiktok",
      href: "https://www.tiktok.com/@clipzhub06/live",
      handle: "@clipzhub06",
    });
    const home = { ...s.channels, vertical: { guest: false, host: "@clipzhub06", url: "" } };
    expect(shareTarget({ channels: home }, "tiktok").href).toBe("https://www.tiktok.com/@madnco8/live");
  });

  it("main link = Twitch, or the borrowed YouTube in landscape Guest mode", () => {
    const s = status();
    expect(shareTarget(s, "auto").platform).toBe("twitch");
    const guest = { ...s.channels, landscape: { guest: true, host: "@madhauzz", url: "https://www.youtube.com/@madhauzz/live" } };
    expect(shareTarget({ channels: guest }, "auto")).toMatchObject({ platform: "youtube", handle: "@madhauzz" });
  });
});

describe("shareCard", () => {
  it("live: the goal with LIVE, the game's live picture for that platform", () => {
    const card = shareCard(status({ live: true }), "tiktok", NOW);
    expect(card.title).toBe("🔴 LIVE: Un débutant peut-il battre God of War ?");
    expect(card.description).toContain("God of War · Part 2 · Deaths 47");
    expect(card.description).toContain("Tap to watch on TikTok");
    expect(card.image).toBe(ART.tiktok);
    expect(card.imageType).toBe("image/jpeg");
  });

  it("offline: the offline picture and the next stream", () => {
    const at = NOW + 2 * 86_400_000;
    const card = shareCard(status({ live: false, next: { at, plan: "" } }), "twitch", NOW);
    expect(card.title).not.toContain("LIVE");
    expect(card.image).toBe(ART.off);
    expect(card.description).toContain("Next stream:");
  });

  it("no picture yet: the site's share image", () => {
    const plain = { ...status({ live: true }), play: publicPlay({ ...gow, art: null }) };
    expect(shareCard(plain, "youtube", NOW).image).toBe("https://www.madnco.frankjordan.dev/og-image.png");
  });
});

describe("sharePage", () => {
  it("escapes text and forwards people to the live page", () => {
    const card = { title: `"><script>`, description: "a & b", image: ART.off, imageType: "image/jpeg", alt: "x" };
    const html = sharePage(card, { href: "https://www.twitch.tv/madnco8", platform: "twitch" }, "https://x/live");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&#34;&#62;&#60;script&#62;");
    expect(html).toContain('<meta http-equiv="refresh" content="0;url=https://www.twitch.tv/madnco8">');
    expect(html).toContain(`<meta property="og:image" content="${ART.off}">`);
  });
});

describe("sanitizeArt", () => {
  it("keeps four Vercel Blob URLs, drops anything else", () => {
    expect(sanitizeArt(ART)).toEqual(ART);
    expect(sanitizeArt({ ...ART, off: "https://evil.example/x.jpg" })).toBeNull();
    expect(sanitizeArt({ tiktok: ART.tiktok })).toBeNull();
    expect(sanitizeArt("x")).toBeNull();
  });
});
