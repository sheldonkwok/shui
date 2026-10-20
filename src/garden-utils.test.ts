import { describe, expect, it } from "vitest";
import { choreStatus, formatMonthRange, inSeason, irrigationSchedule, seasonStart } from "./garden-utils.ts";

const DAY = 24 * 60 * 60 * 1000;

describe("inSeason", () => {
  it("handles a window inside one year", () => {
    expect(inSeason(3, 3, 5)).toBe(true);
    expect(inSeason(5, 3, 5)).toBe(true);
    expect(inSeason(6, 3, 5)).toBe(false);
  });

  it("handles a window that wraps the new year", () => {
    expect(inSeason(12, 11, 2)).toBe(true);
    expect(inSeason(1, 11, 2)).toBe(true);
    expect(inSeason(3, 11, 2)).toBe(false);
  });
});

describe("seasonStart", () => {
  it("starts in the previous year for the tail of a wrapping window", () => {
    expect(seasonStart(11, 2, new Date(2027, 0, 15))).toEqual(new Date(2026, 10, 1));
  });

  it("starts this year for the head of a wrapping window", () => {
    expect(seasonStart(11, 2, new Date(2026, 11, 15))).toEqual(new Date(2026, 10, 1));
  });

  it("is null out of season", () => {
    expect(seasonStart(3, 4, new Date(2026, 9, 1))).toBeNull();
  });
});

describe("choreStatus", () => {
  const now = new Date(2026, 3, 10); // Apr 10

  it("is due in season with no completion this season", () => {
    expect(choreStatus(3, 5, null, now)).toBe("due");
    expect(choreStatus(3, 5, new Date(2025, 3, 1), now)).toBe("due");
  });

  it("is done once completed this season", () => {
    expect(choreStatus(3, 5, new Date(2026, 2, 2), now)).toBe("done");
  });

  it("is upcoming out of season", () => {
    expect(choreStatus(6, 8, new Date(2025, 6, 1), now)).toBe("upcoming");
  });
});

describe("formatMonthRange", () => {
  it("formats single and multi-month windows", () => {
    expect(formatMonthRange(3, 3)).toBe("Mar");
    expect(formatMonthRange(11, 2)).toBe("Nov–Feb");
  });
});

describe("irrigationSchedule", () => {
  const now = new Date("2026-07-10T12:00:00Z");

  it("has no schedule until there are two runs", () => {
    expect(irrigationSchedule([], now)).toEqual({
      lastRun: null,
      avgIntervalDays: null,
      daysUntilNextRun: null,
    });
    const only = new Date(now.getTime() - DAY);
    expect(irrigationSchedule([only], now)).toEqual({
      lastRun: only,
      avgIntervalDays: null,
      daysUntilNextRun: null,
    });
  });

  it("averages the gaps between runs and counts down from the last one", () => {
    const runs = [1, 4, 7].map((d) => new Date(now.getTime() - d * DAY));
    expect(irrigationSchedule(runs, now)).toEqual({
      lastRun: runs[0],
      avgIntervalDays: 3,
      daysUntilNextRun: 2,
    });
  });
});
