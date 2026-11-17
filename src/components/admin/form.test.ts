import { DEFAULT_STATE, type StreamState } from "@/lib/stream/state";
import {
  EMPTY_FORM,
  changedCount,
  changedFields,
  emptyForm,
  formIssues,
  fromForm,
  toForm,
} from "./form";

describe("admin form", () => {
  const now = new Date(2026, 10, 17, 18, 30).getTime();
  const saved: StreamState = {
    ...DEFAULT_STATE,
    topic: "FIFA night",
    game: "FIFA",
    next: { at: new Date(2026, 10, 21, 20, 0).getTime(), plan: "RDR2", show: true },
    updatedAt: now - 1,
  };

  it("round-trips the saved state", () => {
    const form = toForm(saved);
    expect(form).toMatchObject({
      nextDate: "2026-11-21",
      nextTime: "20:00",
      nextPlan: "RDR2",
    });
    expect(fromForm(form, saved)).toEqual(saved);
    expect(changedCount(form, saved)).toBe(0);
  });

  it("counts changed fields and empties everything on reset", () => {
    const form = { ...toForm(saved), topic: "CoD", nextTime: "21:00" };
    expect(changedCount(form, saved)).toBe(2);
    expect(changedCount(EMPTY_FORM, saved)).toBe(5);
    expect(fromForm(EMPTY_FORM, saved)).toMatchObject({
      mode: "auto",
      topic: "",
      game: "",
      countdown: null,
      next: null,
    });
  });

  it("asks for the missing half of a date", () => {
    const base = toForm(DEFAULT_STATE);
    expect(formIssues({ ...base, nextDate: "2026-11-21" }, DEFAULT_STATE, now)).toEqual([
      { field: "nextTime", tab: "schedule", message: "Pick a time too" },
    ]);
    expect(formIssues({ ...base, nextTime: "20:00" }, DEFAULT_STATE, now)[0].field).toBe(
      "nextDate",
    );
    expect(formIssues({ ...base, nextPlan: "RDR2" }, DEFAULT_STATE, now)[0].field).toBe(
      "nextDate",
    );
  });

  it("refuses a new date that is already over", () => {
    const base = toForm(DEFAULT_STATE);
    const yesterday = { ...base, nextDate: "2026-11-16", nextTime: "20:00" };
    expect(formIssues(yesterday, DEFAULT_STATE, now)).toEqual([
      { field: "nextDate", tab: "schedule", message: "That day is already over" },
    ]);
    const earlier = { ...base, nextDate: "2026-11-17", nextTime: "17:00" };
    expect(formIssues(earlier, DEFAULT_STATE, now)[0].field).toBe("nextTime");
    const later = { ...base, nextDate: "2026-11-17", nextTime: "20:00" };
    expect(formIssues(later, DEFAULT_STATE, now)).toEqual([]);
  });

  it("lets a saved time pass while the stream runs", () => {
    const running = { ...saved, next: { at: now - 600_000, plan: "", show: true } };
    expect(formIssues(toForm(running), running, now)).toEqual([]);
  });

  it("checks clip links and maps changes to tabs", () => {
    const base = toForm(saved);
    expect(formIssues({ ...base, clipUrl: "https://example.com" }, saved, now)).toEqual([
      { field: "clipUrl", tab: "web", message: "Not a TikTok video, YouTube video or Twitch clip link" },
    ]);
    const form = {
      ...base,
      brbMessage: "Snack run",
      tickerItems: ["!discord", "  "],
      quest: { ...base.quest, followers: 30, onBrb: false },
      clipUrl: "https://youtu.be/dQw4w9WgXcQ",
    };
    const tabs = changedFields(form, saved).map((change) => change.tab);
    expect(tabs).toEqual(["live", "screen", "screen", "quest", "web"]);
    const state = fromForm(form, saved);
    expect(state.ticker.items).toEqual(["!discord"]);
    expect(state.clip).toMatchObject({ platform: "youtube", id: "dQw4w9WgXcQ", show: true });
  });

  it("keeps presets when everything is reset", () => {
    const withPresets = { ...toForm(saved), presets: [{ name: "FIFA night", topic: "", game: "FIFA", plan: "" }] };
    expect(emptyForm(withPresets).presets).toHaveLength(1);
    expect(emptyForm(withPresets).topic).toBe("");
  });
});
