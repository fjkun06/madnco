import { DEFAULT_STATE, type StreamState } from "@/lib/stream/state";
import { EMPTY_FORM, changedCount, formIssues, fromForm, toForm } from "./form";

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
      { field: "nextTime", message: "Pick a time too" },
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
      { field: "nextDate", message: "That day is already over" },
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
});
