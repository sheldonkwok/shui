import { describe, it, expect } from "vitest";
import { calculateIntervals, WaterRecord } from "./plants.ts";

const DAY = 24 * 60 * 60 * 1000;

describe("calculateIntervals", () => {
  const now = new Date();
  const time = now.getTime();

  it("should return 7 days for 3 waterings separated by 7 days each", () => {
    // Create 3 waterings separated by 7 days
    const sevenDaysAgo = new Date(time - 7 * DAY);
    const fourteenDaysAgo = new Date(time - 14 * DAY);

    const waterings = [
      { plantId: 1, wateringTime: now },
      { plantId: 1, wateringTime: sevenDaysAgo },
      { plantId: 1, wateringTime: fourteenDaysAgo },
    ];

    const result = calculateIntervals(waterings);

    expect(result[1]).toBe(7);
  });

  it("should return null for plants with fewer than 2 waterings", () => {
    const waterings = [{ plantId: 1, wateringTime: now }];
    const result = calculateIntervals(waterings);

    expect(result[1]).toBeNull();
  });

  it("should return null for plants with no waterings", () => {
    const waterings: Array<WaterRecord> = [];

    const result = calculateIntervals(waterings);

    expect(result[1]).toBeUndefined();
  });

  it("should handle multiple plants separately", () => {
    const plant1Day7 = new Date(time - 7 * DAY);
    const plant1Day14 = new Date(time - 14 * DAY);
    const plant2Day3 = new Date(time - 3 * DAY);
    const plant2Day6 = new Date(time - 6 * DAY);

    const waterings = [
      { plantId: 1, wateringTime: now },
      { plantId: 1, wateringTime: plant1Day7 },
      { plantId: 1, wateringTime: plant1Day14 },
      { plantId: 2, wateringTime: now },
      { plantId: 2, wateringTime: plant2Day3 },
      { plantId: 2, wateringTime: plant2Day6 },
    ];

    const result = calculateIntervals(waterings);

    expect(result[1]).toBe(7);
    expect(result[2]).toBe(3);
  });

  it("should only use the 5 most recent waterings", () => {
    const waterings = [
      { plantId: 1, wateringTime: now },
      { plantId: 1, wateringTime: new Date(time - 2 * DAY) },
      { plantId: 1, wateringTime: new Date(time - 4 * DAY) },
      { plantId: 1, wateringTime: new Date(time - 6 * DAY) },
      { plantId: 1, wateringTime: new Date(time - 8 * DAY) },
      // This 6th watering should be ignored (100 days old)
      { plantId: 1, wateringTime: new Date(time - 100 * DAY) },
    ];

    const result = calculateIntervals(waterings);

    // Average of intervals: 2, 2, 2, 2 = 2 days
    expect(result[1]).toBe(2);
  });

  it("should round to 1 decimal place", () => {
    const waterings = [
      { plantId: 1, wateringTime: now },
      { plantId: 1, wateringTime: new Date(time - 3.5 * DAY) },
      { plantId: 1, wateringTime: new Date(time - 7 * DAY) },
    ];

    const result = calculateIntervals(waterings);

    // Average of 3.5 and 3.5 = 3.5
    expect(result[1]).toBe(3.5);
  });

  it("should handle waterings less than 1 day apart", () => {
    const now = new Date();
    const halfDayAgo = new Date(time - 0.5 * DAY);
    const oneDayAgo = new Date(time - 1 * DAY);

    const waterings = [
      { plantId: 1, wateringTime: now },
      { plantId: 1, wateringTime: halfDayAgo },
      { plantId: 1, wateringTime: oneDayAgo },
    ];

    const result = calculateIntervals(waterings);

    // Average of 0.5 and 0.5 = 0.5
    expect(result[1]).toBe(0.5);
  });
});
