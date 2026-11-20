import {
  COUNTDOWN_GRACE_MS,
  DEFAULT_STATE,
  NEXT_GRACE_MS,
  OFFLINE_STATUS,
  TOPIC_MAX,
  cleanText,
  formatNextWhen,
  nowPlayingText,
  prepareSave,
  pruneState,
  publicStatus,
  sanitizeState,
  saveError,
} from "./state";

const NOW = Date.UTC(2026, 10, 17, 12, 0, 0);

describe("cleanText", () => {
  it("collapses whitespace, drops control characters and cuts to the limit", () => {
    expect(cleanText("  FIFA \n\t night\u0007 ", 80)).toBe("FIFA night");
    expect(cleanText("x".repeat(200), 10)).toHaveLength(10);
    expect(cleanText(42, 10)).toBe("");
  });
});

describe("sanitizeState", () => {
  it("falls back to defaults for junk", () => {
    expect(sanitizeState(null, NOW)).toEqual({ ...DEFAULT_STATE, updatedAt: NOW });
    expect(sanitizeState({ mode: "party" }, NOW).mode).toBe("auto");
  });

  it("keeps valid values and limits text length", () => {
    const state = sanitizeState(
      {
        mode: "live",
        topic: "t".repeat(500),
        game: "RDR2",
        countdown: { from: NOW, to: NOW + 60_000 },
        next: { at: NOW + 3_600_000, plan: "Story mode", show: true },
        extra: "dropped",
      },
      NOW,
    );
    expect(state.mode).toBe("live");
    expect(state.topic).toHaveLength(TOPIC_MAX);
    expect(state.game).toBe("RDR2");
    expect(state.countdown).toEqual({ from: NOW, to: NOW + 60_000 });
    expect(state.next).toEqual({ at: NOW + 3_600_000, plan: "Story mode", show: true });
    expect(state).not.toHaveProperty("extra");
  });

  it("drops a countdown that ends before it starts", () => {
    expect(
      sanitizeState({ countdown: { from: NOW, to: NOW - 1 } }, NOW).countdown,
    ).toBeNull();
  });
});

describe("publicStatus", () => {
  const base = { ...DEFAULT_STATE, updatedAt: NOW };

  it("follows Twitch in auto mode", () => {
    expect(publicStatus(base, true, NOW)).toMatchObject({ live: true, source: "twitch" });
    expect(publicStatus(base, false, NOW)).toMatchObject({ live: false, source: "none" });
    expect(publicStatus(base, null, NOW)).toMatchObject({ live: false, source: "none" });
  });

  it("lets the admin force live or offline", () => {
    expect(publicStatus({ ...base, mode: "live" }, false, NOW)).toMatchObject({
      live: true,
      source: "manual",
    });
    expect(publicStatus({ ...base, mode: "off" }, true, NOW).live).toBe(false);
  });

  it("uses the Twitch game only when the admin left the game empty", () => {
    expect(publicStatus(base, true, NOW, "EA Sports FC").game).toBe("EA Sports FC");
    expect(publicStatus({ ...base, game: "FIFA" }, true, NOW, "EA Sports FC").game).toBe(
      "FIFA",
    );
    expect(publicStatus(base, false, NOW, "EA Sports FC").game).toBe("");
  });

  it("drops an old countdown and a past or hidden next stream", () => {
    const old = { from: NOW - 2 * COUNTDOWN_GRACE_MS, to: NOW - COUNTDOWN_GRACE_MS - 1 };
    expect(publicStatus({ ...base, countdown: old }, null, NOW).countdown).toBeNull();
    const past = { at: NOW - NEXT_GRACE_MS - 1, plan: "", show: true };
    expect(publicStatus({ ...base, next: past }, null, NOW).next).toBeNull();
    const hidden = { at: NOW + 1000, plan: "x", show: false };
    expect(publicStatus({ ...base, next: hidden }, null, NOW).next).toBeNull();
    const soon = { at: NOW + 1000, plan: "x", show: true };
    expect(publicStatus({ ...base, next: soon }, null, NOW).next).toEqual({
      at: NOW + 1000,
      plan: "x",
    });
  });
});

describe("nowPlayingText", () => {
  it("joins game and topic, skipping empty parts", () => {
    expect(nowPlayingText({ game: "FIFA", topic: "Road to Div 1" })).toBe(
      "FIFA · Road to Div 1",
    );
    expect(nowPlayingText({ game: "", topic: "Chill" })).toBe("Chill");
    expect(nowPlayingText({ game: "", topic: "" })).toBe("");
  });
});

describe("formatNextWhen", () => {
  it("shows weekday and time within a week, the date further out", () => {
    const soon = Date.UTC(2026, 10, 21, 19, 0); // Sat 21 Nov, 20:00 in Berlin
    expect(formatNextWhen(soon, NOW, "en-GB", "Europe/Berlin")).toBe("Sat · 20:00");
    const later = Date.UTC(2026, 10, 28, 19, 0);
    expect(formatNextWhen(later, NOW, "en-GB", "Europe/Berlin")).toBe(
      "Sat 28 Nov · 20:00",
    );
  });
});

describe("pruneState", () => {
  const base = { ...DEFAULT_STATE, updatedAt: NOW };

  it("drops a countdown and a next stream that are long over", () => {
    const old = {
      ...base,
      countdown: { from: NOW - 4_000_000, to: NOW - COUNTDOWN_GRACE_MS - 1 },
      next: { at: NOW - NEXT_GRACE_MS - 1, plan: "x", show: true },
    };
    expect(pruneState(old, NOW)).toMatchObject({ countdown: null, next: null });
  });

  it("keeps recent ones and returns the same object when nothing changes", () => {
    const fresh = {
      ...base,
      countdown: { from: NOW - 60_000, to: NOW - 60_000 + 1 },
      next: { at: NOW - 60_000, plan: "", show: true },
    };
    expect(pruneState(fresh, NOW)).toBe(fresh);
  });
});

describe("saveError and prepareSave", () => {
  const saved = {
    ...DEFAULT_STATE,
    next: { at: NOW - 10 * 60_000, plan: "", show: true },
    updatedAt: NOW - 1,
  };

  it("refuses a new next stream in the past, but not the unchanged saved one", () => {
    const yesterday = { ...saved, next: { at: NOW - 86_400_000, plan: "", show: true } };
    expect(saveError(yesterday, saved, NOW)).toBe("next-in-past");
    expect(saveError({ ...saved, topic: "new" }, saved, NOW)).toBeNull();
    const later = { ...saved, next: { at: NOW + 3_600_000, plan: "", show: true } };
    expect(saveError(later, saved, NOW)).toBeNull();
  });

  it("refuses a new countdown that already ended", () => {
    const cd = { ...saved, countdown: { from: NOW - 120_000, to: NOW - 1 } };
    expect(saveError(cd, saved, NOW)).toBe("countdown-in-past");
  });

  it("starts a new countdown at the save and keeps an unchanged one", () => {
    const fresh = { ...saved, countdown: { from: NOW - 600_000, to: NOW + 600_000 } };
    expect(prepareSave(fresh, saved, NOW).countdown).toEqual({
      from: NOW,
      to: NOW + 600_000,
    });
    expect(prepareSave(fresh, fresh, NOW).countdown).toEqual(fresh.countdown);
    expect(prepareSave(fresh, saved, NOW).updatedAt).toBe(NOW);
  });
});

describe("public extras", () => {
  it("drops an old BRB timer, hides a clip that is switched off and flags a done quest", () => {
    const state = sanitizeState(
      {
        brb: { message: "Snack run", until: NOW - 31 * 60_000 },
        clip: { url: "https://youtu.be/dQw4w9WgXcQ", title: "GOAL", show: false },
        quest: { followers: 60, goal: 50 },
        presets: [{ name: "Secret" }],
      },
      NOW,
    );
    const status = publicStatus(state, null, NOW);
    expect(status.brb).toEqual({ message: "Snack run", until: null });
    expect(status.clip).toBeNull();
    expect(status.quest.done).toBe(true);
    expect(JSON.stringify(status)).not.toContain("Secret");
    expect(pruneState(state, NOW).brb.until).toBeNull();
  });
});

describe("publicStatus with game modes", () => {
  const bo6 = DEFAULT_STATE.games.list.find((g) => g.id === "call-of-duty-black-ops-6")!;
  const state = sanitizeState(
    {
      ...DEFAULT_STATE,
      game: "FIFA",
      games: { list: [bo6], current: bo6.id },
    },
    NOW,
  );

  it("shows the current game with its live values", () => {
    const status = publicStatus(state, true, NOW, "", {
      [bo6.id]: { part: 2, c1: 5, c2: 1, w: 0, d: 0, l: 0, gf: 0, ga: 0, mins: 90 },
    });
    expect(status.game).toBe("Call of Duty: Black Ops 6");
    expect(status.play).toMatchObject({ id: bo6.id, part: 2, hours: 1.5 });
    expect(status.shelf).toEqual([]);
  });

  it("falls back to the typed game when nothing is current", () => {
    const status = publicStatus({ ...state, games: { ...state.games, current: null } }, true, NOW);
    expect(status.play).toBeNull();
    expect(status.game).toBe("FIFA");
  });

  it("keeps the library when an old state is loaded", () => {
    expect(sanitizeState({ mode: "auto" }, NOW).games.list).toHaveLength(28);
    expect(OFFLINE_STATUS.play).toBeNull();
  });
});
