import {
  confirmedHref,
  followerProgress,
  isPlaceholder,
  siteConfig,
} from "./app.constants";

describe("isPlaceholder", () => {
  it.each([
    ["[DISCORD INVITE LINK]", true],
    ["  [x]  ", true],
    ["https://www.tiktok.com/@madnco8", false],
    ["@madnco8", false],
    ["[half", false],
  ])("%s → %s", (value, expected) => {
    expect(isPlaceholder(value)).toBe(expected);
  });
});

describe("confirmedHref", () => {
  it("drops placeholders so they are never used as links", () => {
    expect(confirmedHref("[TWITCH LINK]")).toBeUndefined();
    expect(confirmedHref(siteConfig.links.tiktok)).toBe(siteConfig.links.tiktok);
  });
});

describe("followerProgress", () => {
  it.each([
    [null, 50, 0],
    [0, 50, 0],
    [25, 50, 0.5],
    [50, 50, 1],
    [80, 50, 1],
    [-3, 50, 0],
    [10, 0, 0],
  ])("%s of %s → %s", (followers, goal, expected) => {
    expect(followerProgress(followers, goal)).toBe(expected);
  });
});

describe("siteConfig", () => {
  it("uses the www URL as the canonical address", () => {
    expect(siteConfig.url).toBe("https://www.madnco.frankjordan.dev");
  });

  it("only uses https links or visible placeholders", () => {
    const values = [
      ...Object.values(siteConfig.links),
      siteConfig.animeCaseFiles.tiktok,
      siteConfig.animeCaseFiles.youtube,
    ];
    for (const value of values) {
      expect(isPlaceholder(value) || value.startsWith("https://")).toBe(true);
    }
  });
});
