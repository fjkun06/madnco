import { fromDateTime, nextOccurrence, toDateValue, toTimeValue } from "./time";

describe("admin time helpers", () => {
  const now = new Date(2026, 10, 17, 18, 30).getTime();

  it("round-trips date and time inputs", () => {
    const at = fromDateTime("2026-11-21", "20:05");
    expect(at).toBe(new Date(2026, 10, 21, 20, 5).getTime());
    expect(toDateValue(at)).toBe("2026-11-21");
    expect(toTimeValue(at)).toBe("20:05");
  });

  it("returns empty or null for missing values", () => {
    expect(toTimeValue(null)).toBe("");
    expect(toDateValue(undefined)).toBe("");
    expect(fromDateTime("", "20:00")).toBeNull();
    expect(fromDateTime("2026-11-21", "8pm")).toBeNull();
  });

  it("puts a go-live time today when ahead, tomorrow when already past", () => {
    expect(nextOccurrence("20:00", now)).toBe(new Date(2026, 10, 17, 20, 0).getTime());
    expect(nextOccurrence("00:15", now)).toBe(new Date(2026, 10, 18, 0, 15).getTime());
  });
});
