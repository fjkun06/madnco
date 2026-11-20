import {
  DEFAULT_CHANNELS,
  DEFAULT_CO,
  cleanHandle,
  hostUrl,
  pickCo,
  publicChannels,
  sanitizeChannels,
  sanitizeCo,
} from "./channels";

describe("cleanHandle", () => {
  it("normalises handles and rejects junk", () => {
    expect(cleanHandle("madhauzz")).toBe("@madhauzz");
    expect(cleanHandle(" @@Mad.Hauzz ")).toBe("@Mad.Hauzz");
    expect(cleanHandle("bad handle")).toBe("");
    expect(cleanHandle("@")).toBe("");
    expect(cleanHandle(42)).toBe("");
  });
});

describe("sanitizeChannels", () => {
  it("defaults to home on YouTube/Twitch and guest on TikTok", () => {
    expect(sanitizeChannels(undefined)).toEqual(DEFAULT_CHANNELS);
    expect(DEFAULT_CHANNELS.landscape.guest).toBe(false);
    expect(DEFAULT_CHANNELS.vertical).toEqual({ guest: true, host: "@clipzhub06" });
  });

  it("keeps valid values and falls back for a bad host", () => {
    const ch = sanitizeChannels({
      landscape: { guest: true, host: "madhauzz" },
      vertical: { guest: "yes", host: "no spaces allowed" },
      guestLine: "  Anime   later ",
      homeCard: false,
    });
    expect(ch.landscape).toEqual({ guest: true, host: "@madhauzz" });
    expect(ch.vertical).toEqual({ guest: false, host: "@clipzhub06" });
    expect(ch.guestLine).toBe("Anime later");
    expect(ch.homeCard).toBe(false);
  });

  it("builds the guest live links", () => {
    expect(hostUrl("landscape", "@madhauzz")).toBe("https://www.youtube.com/@madhauzz/live");
    expect(hostUrl("vertical", "@clipzhub06")).toBe("https://www.tiktok.com/@clipzhub06/live");
    expect(publicChannels(DEFAULT_CHANNELS).vertical.url).toBe(
      "https://www.tiktok.com/@clipzhub06/live",
    );
  });
});

describe("co", () => {
  it("starts solo with Courinho on the roster", () => {
    expect(sanitizeCo(null)).toEqual(DEFAULT_CO);
    expect(DEFAULT_CO).toEqual({ name: "", roster: ["Courinho"] });
  });

  it("adds a new Co to the roster once, case-insensitive", () => {
    const co = pickCo(DEFAULT_CO, "  Kevin ");
    expect(co).toEqual({ name: "Kevin", roster: ["Courinho", "Kevin"] });
    expect(pickCo(co, "kevin").roster).toHaveLength(2);
    expect(pickCo(co, "").name).toBe("");
  });

  it("caps the roster", () => {
    const roster = Array.from({ length: 20 }, (_, i) => `P${i}`);
    expect(sanitizeCo({ roster }).roster).toHaveLength(12);
  });
});
