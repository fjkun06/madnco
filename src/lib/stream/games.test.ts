import {
  DEFAULT_GAMES,
  DEFAULT_LIBRARY,
  EMPTY_LIVE,
  GAMES_MAX,
  liveFromHash,
  newProfile,
  parseDeckAction,
  partLabel,
  publicPlay,
  sanitizeGames,
  shelf,
  slugify,
  uniqueId,
} from "./games";

const NOW = Date.UTC(2026, 10, 19, 12, 0, 0);

describe("slugify / uniqueId", () => {
  it("makes stable ids and avoids clashes", () => {
    expect(slugify("Call of Duty: Black Ops 6")).toBe("call-of-duty-black-ops-6");
    expect(slugify("S.T.A.L.K.E.R. 2")).toBe("s-t-a-l-k-e-r-2");
    expect(slugify("Ragnarök")).toBe("ragnarok");
    expect(slugify("!!!")).toBe("game");
    expect(uniqueId("FC 26", ["fc-26"])).toBe("fc-26-2");
    expect(uniqueId("FC 26", ["fc-26", "fc-26-2"])).toBe("fc-26-3");
  });
});

describe("default library", () => {
  it("has all 28 installed games with unique ids", () => {
    expect(DEFAULT_LIBRARY).toHaveLength(28);
    expect(new Set(DEFAULT_LIBRARY.map((g) => g.id)).size).toBe(28);
    expect(DEFAULT_GAMES.current).toBeNull();
  });

  it("starts Black Ops 6 with deaths and missions", () => {
    const bo6 = DEFAULT_LIBRARY.find((g) => g.id === "call-of-duty-black-ops-6");
    expect(bo6?.counters.map((c) => c.label)).toEqual(["Deaths", "Missions"]);
    expect(bo6?.mood).toBe("action");
  });
});

describe("sanitizeGames", () => {
  it("gives the default library to state saved before v4", () => {
    expect(sanitizeGames(undefined)).toEqual(DEFAULT_GAMES);
    expect(sanitizeGames({ list: "x" })).toEqual(DEFAULT_GAMES);
  });

  it("keeps an empty library empty", () => {
    expect(sanitizeGames({ list: [], current: "x" })).toEqual({ list: [], current: null });
  });

  it("cleans profiles and drops junk", () => {
    const games = sanitizeGames({
      list: [
        {
          id: "bo6",
          name: "  Black Ops 6 ",
          mood: "party",
          widget: "nope",
          unit: "",
          counters: [
            { label: "Deaths", total: 0 },
            { label: "Missions", total: 16.4 },
            { label: "Third", total: 3 },
          ],
          ticker: ["a", "", "b", "c", "d", "e"],
          completedAt: "yesterday",
        },
        { name: "" },
        { id: "bo6", name: "Black Ops 6" },
        "junk",
      ],
      current: "bo6",
    });
    expect(games.list).toHaveLength(2);
    const [first, second] = games.list;
    expect(first).toMatchObject({
      id: "bo6",
      name: "Black Ops 6",
      mood: "action",
      widget: "counters",
      unit: "Part",
      completedAt: null,
    });
    expect(first.counters).toEqual([
      { label: "Deaths", total: null },
      { label: "Missions", total: 16 },
    ]);
    expect(first.ticker).toEqual(["a", "b", "c", "d"]);
    expect(second.id).toBe("black-ops-6");
    expect(games.current).toBe("bo6");
  });

  it("forgets a current game that isn't in the list and caps the list", () => {
    expect(sanitizeGames({ list: [{ name: "A" }], current: "b" }).current).toBeNull();
    const many = Array.from({ length: 60 }, (_, i) => ({ name: `Game ${i}` }));
    expect(sanitizeGames({ list: many }).list).toHaveLength(GAMES_MAX);
  });
});

describe("live values", () => {
  it("reads Redis hashes as arrays or objects, clamped", () => {
    expect(liveFromHash(null)).toEqual(EMPTY_LIVE);
    expect(liveFromHash(["part", "3", "c1", "12", "mins", "95"])).toMatchObject({
      part: 3,
      c1: 12,
      mins: 95,
    });
    expect(liveFromHash({ part: "0", c2: "-4", w: "abc" })).toMatchObject({
      part: 1,
      c2: 0,
      w: 0,
    });
  });

  it("parses Stream Deck actions", () => {
    expect(parseDeckAction("c1+")).toEqual({ field: "c1", by: 1 });
    expect(parseDeckAction("C2-")).toEqual({ field: "c2", by: -1 });
    expect(parseDeckAction("part")).toEqual({ field: "part", by: 1 });
    expect(parseDeckAction("w")).toEqual({ field: "w", by: 1 });
    expect(parseDeckAction("hour+")).toEqual({ field: "mins", by: 60 });
    expect(parseDeckAction("mins+")).toBeNull();
    expect(parseDeckAction("c3+")).toBeNull();
    expect(parseDeckAction(undefined)).toBeNull();
  });
});

describe("publicPlay", () => {
  const base = { ...newProfile("Black Ops 6", []), counters: [
    { label: "Deaths", total: null },
    { label: "Missions", total: 16 },
  ] };
  const live = { ...EMPTY_LIVE, part: 3, c1: 14, c2: 4, mins: 250 };

  it("joins the profile with live values", () => {
    const play = publicPlay(base, live);
    expect(play).toMatchObject({ name: "Black Ops 6", part: 3, hours: 4.2, finalPart: false });
    expect(play.counters).toEqual([
      { label: "Deaths", value: 14, total: null },
      { label: "Missions", value: 4, total: 16 },
    ]);
    expect(partLabel(play)).toBe("Part 3");
  });

  it("hides the part and counters when switched off", () => {
    const play = publicPlay({ ...base, showPart: false, widget: "none" }, live);
    expect(play.part).toBeNull();
    expect(play.counters).toEqual([]);
    expect(partLabel(play)).toBe("");
  });

  it("only shows an open poll with two options", () => {
    const poll = { question: "Spare him?", options: ["Yes", "No"], open: true, openedAt: NOW };
    expect(publicPlay({ ...base, widget: "poll", poll }).poll).toEqual({
      question: "Spare him?",
      options: ["Yes", "No"],
      openedAt: NOW,
    });
    expect(publicPlay({ ...base, widget: "poll", poll: { ...poll, open: false } }).poll).toBeNull();
    expect(
      publicPlay({ ...base, widget: "poll", poll: { ...poll, options: ["Yes", ""] } }).poll,
    ).toBeNull();
    expect(publicPlay({ ...base, widget: "counters", poll }).poll).toBeNull();
  });

  it("drops the final-part badge once completed", () => {
    expect(publicPlay({ ...base, finalPart: true }).finalPart).toBe(true);
    const done = publicPlay({ ...base, finalPart: true, completedAt: NOW });
    expect(done.finalPart).toBe(false);
    expect(done.completed).toBe(true);
  });
});

describe("shelf", () => {
  it("lists finished series, newest first, with their stats", () => {
    const a = { ...newProfile("Old", []), completedAt: NOW - 1000 };
    const b = { ...newProfile("New", ["old"]), completedAt: NOW };
    const c = newProfile("Ongoing", ["old", "new"]);
    const items = shelf({ list: [a, b, c], current: c.id }, { old: { ...EMPTY_LIVE, part: 7, mins: 600, c1: 30 } });
    expect(items.map((i) => i.name)).toEqual(["New", "Old"]);
    expect(items[1]).toMatchObject({ parts: 7, hours: 10 });
    expect(items[1].counters).toEqual([{ label: "Deaths", value: 30, total: null }]);
  });
});
