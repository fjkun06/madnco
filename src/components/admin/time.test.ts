import {
  dayOffset,
  formatDay,
  formatDuration,
  fromDateTime,
  monthGrid,
  nextOccurrence,
  nextWeekday,
  relativeDay,
  toDateValue,
  toTimeValue,
} from "./time";

describe("admin time helpers", () => {
  const now = new Date(2026, 10, 17, 18, 30).getTime(); // Tue 17 Nov 2026

  it("round-trips date and time inputs", () => {
    const at = fromDateTime("2026-11-21", "20:05");
    expect(at).toBe(new Date(2026, 10, 21, 20, 5).getTime());
    expect(toDateValue(at)).toBe("2026-11-21");
    expect(toTimeValue(at)).toBe("20:05");
  });

  it("returns empty or null for missing or impossible values", () => {
    expect(toTimeValue(null)).toBe("");
    expect(toDateValue(undefined)).toBe("");
    expect(fromDateTime("", "20:00")).toBeNull();
    expect(fromDateTime("2026-11-21", "8pm")).toBeNull();
    expect(fromDateTime("2026-02-31", "20:00")).toBeNull();
    expect(fromDateTime("2026-11-21", "25:00")).toBeNull();
  });

  it("puts a go-live time today when ahead, tomorrow when already past", () => {
    expect(nextOccurrence("20:00", now)).toBe(new Date(2026, 10, 17, 20, 0).getTime());
    expect(nextOccurrence("00:15", now)).toBe(new Date(2026, 10, 18, 0, 15).getTime());
  });

  it("names days relative to today", () => {
    const day = (d: number) => new Date(2026, 10, d, 9).getTime();
    expect(dayOffset(day(21), now)).toBe(4);
    expect(relativeDay(day(17), now)).toBe("today");
    expect(relativeDay(day(18), now)).toBe("tomorrow");
    expect(relativeDay(day(16), now)).toBe("yesterday");
    expect(relativeDay(day(21), now)).toBe("in 4 days");
    expect(relativeDay(day(14), now)).toBe("3 days ago");
    expect(formatDay("2026-11-21")).toBe("Sat 21 Nov");
  });

  it("formats durations", () => {
    expect(formatDuration(30_000)).toBe("under a minute");
    expect(formatDuration(45 * 60_000)).toBe("45 min");
    expect(formatDuration(72 * 60_000)).toBe("1 h 12 min");
    expect(formatDuration(120 * 60_000)).toBe("2 h");
    expect(formatDuration((51 * 60 + 5) * 60_000)).toBe("2 d 3 h");
  });

  it("builds a six-week month starting on Monday", () => {
    const grid = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ value: "2026-10-26", day: 26, inMonth: false });
    expect(grid[6]).toEqual({ value: "2026-11-01", day: 1, inMonth: true });
  });

  it("finds the coming weekend", () => {
    expect(nextWeekday(6, now)).toBe("2026-11-21");
    expect(nextWeekday(0, now)).toBe("2026-11-22");
    expect(nextWeekday(2, now)).toBe("2026-11-17");
  });
});
