import {
  dayBuckets,
  durationMinutes,
  emptyEntry,
  entriesIn,
  followersByBucket,
  formatMinutes,
  hourBuckets,
  hoursByBucket,
  isoWeek,
  periodRange,
  sanitizeLogEntry,
  shiftAnchor,
  totals,
  type StreamLogEntry,
} from "./streamLog";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const NOW = 1_790_000_000_000;

function entry(date: string, start: string, end: string, patch: Partial<StreamLogEntry> = {}): StreamLogEntry {
  return { ...emptyEntry(date), id: `id${date.replaceAll("-", "")}${start.replace(":", "")}`, start, end, ...patch };
}

describe("durationMinutes", () => {
  it("counts minutes between start and end", () => {
    expect(durationMinutes("19:00", "21:35")).toBe(155);
  });
  it("wraps past midnight", () => {
    expect(durationMinutes("22:30", "01:00")).toBe(150);
  });
  it("rejects equal or broken times", () => {
    expect(durationMinutes("20:00", "20:00")).toBeNull();
    expect(durationMinutes("25:00", "20:00")).toBeNull();
    expect(durationMinutes("", "20:00")).toBeNull();
  });
  it("formats", () => {
    expect(formatMinutes(155)).toBe("2 h 35 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(120)).toBe("2 h");
  });
});

describe("sanitizeLogEntry", () => {
  it("needs a date and valid times", () => {
    expect(sanitizeLogEntry({ date: "2026-11-20", start: "19:00" }, NOW)).toBeNull();
    expect(sanitizeLogEntry({ date: "2026-13-01", start: "19:00", end: "20:00" }, NOW)).toBeNull();
    expect(sanitizeLogEntry(null, NOW)).toBeNull();
  });
  it("cleans numbers, text, goal and rating", () => {
    const clean = sanitizeLogEntry(
      {
        date: "2026-11-20",
        start: "19:00",
        end: "21:00",
        game: "  Black Ops 6  ",
        part: "3",
        platforms: { twitch: { peak: "12", avg: "7,46", newFollowers: -4 }, tiktok: { comments: 1e12 } },
        goal: "won",
        rating: 9,
        notes: "x".repeat(900),
      },
      NOW,
    )!;
    expect(clean.game).toBe("Black Ops 6");
    expect(clean.part).toBe(3);
    expect(clean.platforms.twitch.peak).toBe(12);
    expect(clean.platforms.twitch.avg).toBe(7.5);
    expect(clean.platforms.twitch.newFollowers).toBeNull();
    expect(clean.platforms.youtube.peak).toBeNull();
    expect(clean.platforms.tiktok.comments).toBe(10_000_000);
    expect(clean.goal).toBe("none");
    expect(clean.rating).toBeNull();
    expect(clean.notes.length).toBe(600);
    expect(clean.updatedAt).toBe(NOW);
    expect(clean.id).toMatch(/^[a-z0-9]{6,24}$/);
  });
  it("keeps a valid id (edit) and a valid goal", () => {
    const clean = sanitizeLogEntry({ id: "abc123xyz", date: "2026-11-20", start: "19:00", end: "20:00", goal: "partly", rating: 4 }, NOW)!;
    expect(clean.id).toBe("abc123xyz");
    expect(clean.goal).toBe("partly");
    expect(clean.rating).toBe(4);
  });
});

describe("periods", () => {
  it("weeks start on Monday", () => {
    expect(periodRange("week", "2026-11-23")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(periodRange("week", "2026-11-29")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
    expect(periodRange("week", "2026-12-31")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });
  it("months and years", () => {
    expect(periodRange("month", "2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(periodRange("year", "2026-06-01")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
  it("shifts the anchor, clamping the day", () => {
    expect(shiftAnchor("month", "2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftAnchor("month", "2026-01-15", -1)).toBe("2025-12-15");
    expect(shiftAnchor("week", "2026-11-23", -1)).toBe("2026-11-16");
    expect(shiftAnchor("year", "2028-02-29", 1)).toBe("2029-02-28");
  });
  it("ISO week numbers", () => {
    expect(isoWeek("2026-11-23")).toBe(48);
    expect(isoWeek("2027-01-01")).toBe(53);
    expect(isoWeek("2026-01-01")).toBe(1);
  });
  it("buckets", () => {
    const week = periodRange("week", "2026-11-23");
    expect(dayBuckets("week", week, MONTHS, DAYS).map((b) => b.label)).toEqual(DAYS);
    const month = periodRange("month", "2026-11-23");
    expect(dayBuckets("month", month, MONTHS, DAYS)).toHaveLength(30);
    const weeks = hourBuckets("month", month, MONTHS, DAYS);
    expect(weeks[0]).toEqual({ key: "2026-11-01", label: "Wk 44", from: "2026-11-01", to: "2026-11-01" });
    expect(weeks.at(-1)!.to).toBe("2026-11-30");
    expect(dayBuckets("year", periodRange("year", "2026-01-01"), MONTHS, DAYS)[1].label).toBe("Feb");
  });
});

describe("totals and series", () => {
  const a = entry("2026-11-20", "19:00", "21:00", {
    platforms: {
      twitch: { peak: 9, avg: 6, unique: 30, comments: 40, newFollowers: 3, followers: 50 },
      youtube: { peak: 4, avg: 2, unique: 10, comments: 5, newFollowers: 1, followers: 20 },
      tiktok: { peak: null, avg: null, unique: null, comments: null, newFollowers: null, followers: null },
    },
  });
  const b = entry("2026-11-22", "22:00", "01:00", {
    platforms: {
      twitch: { peak: null, avg: null, unique: null, comments: null, newFollowers: null, followers: null },
      youtube: { peak: null, avg: null, unique: null, comments: null, newFollowers: null, followers: null },
      tiktok: { peak: 40, avg: 20, unique: 200, comments: 90, newFollowers: 12, followers: 300 },
    },
  });
  const c = entry("2026-10-30", "19:00", "20:00");

  it("filters and sorts by range", () => {
    expect(entriesIn([b, c, a], periodRange("month", "2026-11-01")).map((e) => e.date)).toEqual(["2026-11-20", "2026-11-22"]);
  });
  it("adds up a period", () => {
    const sum = totals([a, b]);
    expect(sum.streams).toBe(2);
    expect(sum.minutes).toBe(300);
    expect(sum.newFollowers).toBe(16);
    expect(sum.avgViewers).toBe(14);
    expect(sum.comments).toBe(135);
    expect(sum.followersPerHour).toBe(3.2);
    expect(sum.best).toEqual({ id: b.id, date: "2026-11-22", value: 4 });
    expect(sum.unique).toEqual({ twitch: 30, youtube: 10, tiktok: 200 });
  });
  it("handles an empty period", () => {
    const sum = totals([]);
    expect(sum.avgViewers).toBeNull();
    expect(sum.followersPerHour).toBeNull();
    expect(sum.best).toBeNull();
  });
  it("splits followers and hours into buckets", () => {
    const range = periodRange("week", "2026-11-20");
    const rows = followersByBucket([a, b], dayBuckets("week", range, MONTHS, DAYS));
    expect(rows[4].values).toEqual({ twitch: 3, youtube: 1, tiktok: 0 });
    expect(rows[6].values.tiktok).toBe(12);
    const hours = hoursByBucket([a, b], dayBuckets("week", range, MONTHS, DAYS));
    expect(hours[4].hours).toBe(2);
    expect(hours[6].hours).toBe(3);
  });
});
