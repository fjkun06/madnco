import {
  DEFAULT_QUEST,
  clipEmbedUrl,
  parseClipUrl,
  questDone,
  questProgress,
  questText,
  sanitizeBrb,
  sanitizeClip,
  sanitizePresets,
  sanitizeQuest,
  sanitizeTicker,
} from "./extras";

describe("sanitizeBrb", () => {
  it("cleans the message and keeps only a real time", () => {
    expect(sanitizeBrb({ message: "  Snack\n run ", until: 123 })).toEqual({
      message: "Snack run",
      until: 123,
    });
    expect(sanitizeBrb({ message: "x", until: "soon" }).until).toBeNull();
    expect(sanitizeBrb(null)).toEqual({ message: "", until: null });
  });
});

describe("sanitizeTicker", () => {
  it("drops empty lines, caps the list and keeps known scenes in order", () => {
    const ticker = sanitizeTicker({
      items: ["!discord", "  ", 5, ...Array.from({ length: 10 }, (_, i) => `item ${i}`)],
      scenes: ["brb", "hacker", "gaming"],
    });
    expect(ticker.items[0]).toBe("!discord");
    expect(ticker.items).toHaveLength(8);
    expect(ticker.scenes).toEqual(["gaming", "brb"]);
  });
});

describe("side quest", () => {
  it("falls back to the defaults and clamps numbers", () => {
    expect(sanitizeQuest(undefined)).toEqual(DEFAULT_QUEST);
    const quest = sanitizeQuest({ followers: -5, goal: 0, title: "", show: false });
    expect(quest.followers).toBe(0);
    expect(quest.goal).toBe(1);
    expect(quest.title).toBe(DEFAULT_QUEST.title);
    expect(quest.show).toBe(false);
    expect(sanitizeQuest({ followers: null }).followers).toBeNull();
    expect(sanitizeQuest({ followers: 27.6 }).followers).toBe(28);
  });

  it("knows progress and completion", () => {
    expect(questProgress({ followers: 27, goal: 50 })).toBeCloseTo(0.54);
    expect(questProgress({ followers: 80, goal: 50 })).toBe(1);
    expect(questProgress({ followers: null, goal: 50 })).toBe(0);
    expect(questDone({ followers: 50, goal: 50 })).toBe(true);
    expect(questDone({ followers: 49, goal: 50 })).toBe(false);
  });

  it("fills in the text and switches to the done text", () => {
    const quest = {
      ...DEFAULT_QUEST,
      followers: 27,
      goal: 50,
      text: "{handle}: {left} to go of {goal} ({liveHandle}) {nope}",
    };
    expect(questText(quest)).toBe("@madnco8: 23 to go of 50 (@clipzhub06) {nope}");
    expect(questText({ ...quest, followers: 52 })).toContain("can go LIVE now");
  });
});

describe("clips", () => {
  it("recognises TikTok, YouTube and Twitch links", () => {
    expect(
      parseClipUrl("https://www.tiktok.com/@madnco8/video/7438123456789012345?lang=de"),
    ).toEqual({
      platform: "tiktok",
      id: "7438123456789012345",
    });
    expect(parseClipUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(parseClipUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3")?.id).toBe(
      "dQw4w9WgXcQ",
    );
    expect(parseClipUrl("https://youtube.com/shorts/dQw4w9WgXcQ")?.platform).toBe(
      "youtube",
    );
    expect(parseClipUrl("https://clips.twitch.tv/FunnyClipSlug-abc123")).toEqual({
      platform: "twitch",
      id: "FunnyClipSlug-abc123",
    });
    expect(
      parseClipUrl("https://www.twitch.tv/madnco8/clip/FunnyClipSlug-abc123")?.platform,
    ).toBe("twitch");
  });

  it("rejects everything else", () => {
    for (const bad of [
      "",
      "not a url",
      "javascript:alert(1)",
      "https://evil.com/@x/video/123456789",
      "https://www.tiktok.com/@madnco8",
      "https://youtube.com/watch?v=short",
    ]) {
      expect(parseClipUrl(bad)).toBeNull();
    }
    expect(sanitizeClip({ url: "https://evil.com" })).toBeNull();
  });

  it("builds the player URL, with the parent host for Twitch", () => {
    expect(clipEmbedUrl({ platform: "tiktok", id: "123" }, "x")).toBe(
      "https://www.tiktok.com/embed/v2/123",
    );
    expect(
      clipEmbedUrl({ platform: "twitch", id: "Abc" }, "www.madnco.frankjordan.dev"),
    ).toContain("parent=www.madnco.frankjordan.dev");
  });
});

describe("sanitizePresets", () => {
  it("needs a name, drops duplicates and caps the list", () => {
    const limits = { topic: 80, game: 32, plan: 80 };
    const presets = sanitizePresets(
      [
        { name: "FIFA night", game: "FIFA" },
        { name: "fifa NIGHT" },
        { name: "" },
        ...Array.from({ length: 12 }, (_, i) => ({ name: `P${i}` })),
      ],
      limits,
    );
    expect(presets[0]).toEqual({ name: "FIFA night", topic: "", game: "FIFA", plan: "" });
    expect(presets).toHaveLength(8);
    expect(sanitizePresets("nope", limits)).toEqual([]);
  });
});
