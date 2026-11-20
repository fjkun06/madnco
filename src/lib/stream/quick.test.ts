import { applyQuick, parseQuickOp } from "./quick";
import { DEFAULT_STATE, type StreamState } from "./state";

const NOW = Date.UTC(2026, 10, 20, 20, 0, 0);
const bo6 = DEFAULT_STATE.games.list.find((g) => g.id === "call-of-duty-black-ops-6")!;
const base: StreamState = {
  ...DEFAULT_STATE,
  brb: { message: "Snacks", until: null },
  ticker: { items: ["!discord"], scenes: [] },
  games: { ...DEFAULT_STATE.games, current: bo6.id },
};

describe("parseQuickOp", () => {
  it("accepts known ops and rejects junk", () => {
    expect(parseQuickOp({ op: "brb", minutes: 5 })).toEqual({ op: "brb", minutes: 5 });
    expect(parseQuickOp({ op: "brb", minutes: 0 })).toBeNull();
    expect(parseQuickOp({ op: "brb", minutes: 500 })).toBeNull();
    expect(parseQuickOp({ op: "ticker", scene: "gaming", on: true })).toEqual({
      op: "ticker",
      scene: "gaming",
      on: true,
    });
    expect(parseQuickOp({ op: "ticker", scene: "lobby", on: true })).toBeNull();
    expect(parseQuickOp({ op: "game", id: "Bad ID" })).toBeNull();
    expect(parseQuickOp({ op: "game", id: null })).toEqual({ op: "game", id: null });
    expect(parseQuickOp({ op: "channel", canvas: "vertical", guest: true, host: "x y" })).toBeNull();
    expect(parseQuickOp({ op: "channel", canvas: "landscape", guest: true, host: "madhauzz" })).toEqual({
      op: "channel",
      canvas: "landscape",
      guest: true,
      host: "@madhauzz",
    });
    expect(parseQuickOp({ op: "explode" })).toBeNull();
    expect(parseQuickOp("brb")).toBeNull();
  });
});

describe("applyQuick", () => {
  it("sets and clears the BRB timer, keeping the message", () => {
    const on = applyQuick(base, { op: "brb", minutes: 5 }, NOW)!;
    expect(on.brb).toEqual({ message: "Snacks", until: NOW + 5 * 60_000 });
    expect(applyQuick(on, { op: "brb-clear" }, NOW)!.brb).toEqual({ message: "", until: null });
  });

  it("toggles the ticker on a scene", () => {
    const on = applyQuick(base, { op: "ticker", scene: "gaming", on: true }, NOW)!;
    expect(on.ticker.scenes).toEqual(["gaming"]);
    expect(applyQuick(on, { op: "ticker", scene: "gaming", on: true }, NOW)!.ticker.scenes).toEqual(["gaming"]);
    expect(applyQuick(on, { op: "ticker", scene: "gaming", on: false }, NOW)!.ticker.scenes).toEqual([]);
  });

  it("changes only the game on stream", () => {
    const next = applyQuick(base, { op: "final", on: true }, NOW)!;
    expect(next.games.list.find((g) => g.id === bo6.id)!.finalPart).toBe(true);
    expect(next.games.list.filter((g) => g.finalPart)).toHaveLength(1);
    expect(applyQuick({ ...base, games: { ...base.games, current: null } }, { op: "final", on: true }, NOW)).toBeNull();
  });

  it("switches the game, but only to one in the library", () => {
    expect(applyQuick(base, { op: "game", id: "pes-6" }, NOW)!.games.current).toBe("pes-6");
    expect(applyQuick(base, { op: "game", id: "not-a-game" }, NOW)).toBeNull();
    expect(applyQuick(base, { op: "game", id: null }, NOW)!.games.current).toBeNull();
  });

  it("opens a poll only on a poll game, with a fresh start time", () => {
    expect(applyQuick(base, { op: "poll", open: true }, NOW)).toBeNull();
    const story = { ...base, games: { ...base.games, current: "cyberpunk-2077" } };
    const next = applyQuick(story, { op: "poll", open: true }, NOW)!;
    const cp = next.games.list.find((g) => g.id === "cyberpunk-2077")!;
    expect(cp.poll.open).toBe(true);
    expect(cp.poll.openedAt).toBe(NOW);
  });

  it("switches parts of the game's overlay on and off", () => {
    expect(parseQuickOp({ op: "show", field: "showGoals", on: false })).toEqual({
      op: "show",
      field: "showGoals",
      on: false,
    });
    expect(parseQuickOp({ op: "show", field: "name", on: false })).toBeNull();
    const next = applyQuick(base, { op: "show", field: "showTitle", on: false }, NOW)!;
    expect(next.games.list.find((g) => g.id === bo6.id)!.showTitle).toBe(false);
    expect(applyQuick({ ...base, games: { ...base.games, current: null } }, { op: "show", field: "showTitle", on: false }, NOW)).toBeNull();
  });

  it("picks tonight's Co and flips Home / Guest", () => {
    expect(applyQuick(base, { op: "co", name: "Kevin" }, NOW)!.co).toEqual({
      name: "Kevin",
      roster: ["Courinho", "Kevin"],
    });
    const guest = applyQuick(base, { op: "channel", canvas: "landscape", guest: true }, NOW)!;
    expect(guest.channels.landscape).toEqual({ guest: true, host: "@madhauzz" });
    expect(guest.channels.vertical).toEqual(base.channels.vertical);
  });
});
