import { PRESETS, bump, demoStatus, follow, initialDemo, type DemoState } from "./demoStatus";

const NOW = Date.UTC(2026, 10, 23, 12, 0, 0);

describe("demo stream", () => {
  it("starts on the MW4 death run, live, with the goal as headline", () => {
    const s = demoStatus(initialDemo(NOW), NOW);
    expect(s.live).toBe(true);
    expect(s.play?.name).toBe(PRESETS.action.name);
    expect(s.play?.counters[0]).toEqual({ label: "Deaths", value: 214, total: 1000 });
    expect(s.play?.goal).toBe(PRESETS.action.goals[0]);
    expect(s.countdown).toBeNull();
    expect(s.brb.until).toBeNull();
  });

  it("counts per game and never below zero", () => {
    let state = bump(initialDemo(NOW), "c1", 1);
    expect(state.values.action.c1).toBe(215);
    state = { ...state, mood: "horror" };
    for (let i = 0; i < 20; i++) state = bump(state, "c2", -1);
    expect(state.values.horror.c2).toBe(0);
    state = bump(state, "part", -5);
    expect(state.values.horror.part).toBe(1);
    // Switching back keeps the other game's numbers.
    expect(demoStatus({ ...state, mood: "action" }, NOW).play?.counters[0].value).toBe(215);
  });

  it("football results move the score too", () => {
    let state: DemoState = { ...initialDemo(NOW), mood: "football" };
    state = bump(state, "w", 1);
    const play = demoStatus(state, NOW).play!;
    expect(play.widget).toBe("football");
    expect(play.football).toMatchObject({ w: 4, gf: 16, ga: 9 });
  });

  it("scenes start their own timers", () => {
    const start = { ...initialDemo(NOW), scene: "starting-soon" as const, sceneAt: NOW };
    expect(demoStatus(start, NOW).countdown).toEqual({ from: NOW, to: NOW + 300_000 });
    const brb = { ...initialDemo(NOW), scene: "brb" as const, sceneAt: NOW };
    expect(demoStatus(brb, NOW).brb.until).toBe(NOW + 240_000);
    const end = demoStatus({ ...initialDemo(NOW), scene: "ending" as const }, NOW);
    expect(end.next!.at).toBeGreaterThan(NOW);
    expect(end.next!.plan).toContain("Part 4");
  });

  it("a follow adds a founder and queues one alert", () => {
    const state = follow(initialDemo(NOW), NOW + 1);
    const s = demoStatus(state, NOW + 1);
    expect(s.fans.founders).toHaveLength(4);
    expect(s.fans.alerts).toEqual([
      { id: `demo-${NOW + 1}`, kind: "follow", name: "@chat_legend", platform: "tiktok", n: 4, at: NOW + 1 },
    ]);
    expect(s.quest.followers).toBe(4);
  });
});
