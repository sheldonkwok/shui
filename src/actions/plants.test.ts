import { beforeEach, describe, expect, it } from "vitest";
import { cleanupTestDB, seedPlant, seedWatering } from "../test-utils.ts";
import { getPlants } from "./plants.ts";

const DAY = 24 * 60 * 60 * 1000;

describe("getPlants - watering intervals", () => {
  const now = new Date();
  const time = now.getTime();

  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should return 7 days for 3 waterings separated by 7 days each", async () => {
    // Create plant and waterings
    const plantId = await seedPlant("Test Plant");
    const sevenDaysAgo = new Date(time - 7 * DAY);
    const fourteenDaysAgo = new Date(time - 14 * DAY);

    await seedWatering(plantId, now);
    await seedWatering(plantId, sevenDaysAgo);
    await seedWatering(plantId, fourteenDaysAgo);

    const result = await getPlants();

    expect(result[0]?.avgWateringIntervalDays).toBe(7);
  });

  it("should return null for plants with fewer than 2 waterings", async () => {
    const plantId = await seedPlant("Single Watering Plant");
    await seedWatering(plantId, now);

    const result = await getPlants();

    expect(result[0]?.avgWateringIntervalDays).toBeNull();
  });

  it("should return null for plants with no waterings", async () => {
    await seedPlant("Never Watered Plant");

    const result = await getPlants();

    expect(result[0]?.avgWateringIntervalDays).toBeNull();
  });

  it("should handle multiple plants separately", async () => {
    const plant1Id = await seedPlant("Plant 1");
    const plant2Id = await seedPlant("Plant 2");

    const plant1Day7 = new Date(time - 7 * DAY);
    const plant1Day14 = new Date(time - 14 * DAY);
    const plant2Day3 = new Date(time - 3 * DAY);
    const plant2Day6 = new Date(time - 6 * DAY);

    await seedWatering(plant1Id, now);
    await seedWatering(plant1Id, plant1Day7);
    await seedWatering(plant1Id, plant1Day14);
    await seedWatering(plant2Id, now);
    await seedWatering(plant2Id, plant2Day3);
    await seedWatering(plant2Id, plant2Day6);

    const result = await getPlants();

    const plant1 = result.find((p) => p.id === plant1Id);
    const plant2 = result.find((p) => p.id === plant2Id);

    expect(plant1?.avgWateringIntervalDays).toBe(7);
    expect(plant2?.avgWateringIntervalDays).toBe(3);
  });

  it("should only use the 5 most recent waterings", async () => {
    const plantId = await seedPlant("Frequent Watering Plant");

    await seedWatering(plantId, now);
    await seedWatering(plantId, new Date(time - 2 * DAY));
    await seedWatering(plantId, new Date(time - 4 * DAY));
    await seedWatering(plantId, new Date(time - 6 * DAY));
    await seedWatering(plantId, new Date(time - 8 * DAY));
    // This 6th watering should be ignored (100 days old)
    await seedWatering(plantId, new Date(time - 100 * DAY));

    const result = await getPlants();

    // Average of intervals: 2, 2, 2, 2 = 2 days
    expect(result[0]?.avgWateringIntervalDays).toBe(2);
  });

  it("should round to 1 decimal place", async () => {
    const plantId = await seedPlant("Decimal Plant");

    await seedWatering(plantId, now);
    await seedWatering(plantId, new Date(time - 3.5 * DAY));
    await seedWatering(plantId, new Date(time - 7 * DAY));

    const result = await getPlants();

    // Average of 3.5 and 3.5 = 3.5
    expect(result[0]?.avgWateringIntervalDays).toBe(3.5);
  });

  it("should return null lastFertilized when no waterings are fertilized", async () => {
    const plantId = await seedPlant("Unfertilized Plant");

    await seedWatering(plantId, now);
    await seedWatering(plantId, new Date(time - 7 * DAY));

    const result = await getPlants();

    expect(result[0]?.lastFertilized).toBeNull();
  });

  it("should return the most recent fertilized date as lastFertilized", async () => {
    const plantId = await seedPlant("Fertilized Plant");
    const sevenDaysAgo = new Date(time - 7 * DAY);

    await seedWatering(plantId, now);
    await seedWatering(plantId, sevenDaysAgo, true);
    await seedWatering(plantId, new Date(time - 14 * DAY), true);

    const result = await getPlants();

    expect(result[0]?.lastFertilized).toEqual(sevenDaysAgo);
  });

  it("should handle waterings less than 1 day apart", async () => {
    const plantId = await seedPlant("Frequently Watered Plant");
    const halfDayAgo = new Date(time - 0.5 * DAY);
    const oneDayAgo = new Date(time - 1 * DAY);

    await seedWatering(plantId, now);
    await seedWatering(plantId, halfDayAgo);
    await seedWatering(plantId, oneDayAgo);

    const result = await getPlants();

    // Average of 0.5 and 0.5 = 0.5
    expect(result[0]?.avgWateringIntervalDays).toBe(0.5);
  });

  it("should sort plants by daysUntilNextWatering ascending", async () => {
    const closestId = await seedPlant("Closest");
    const nearId = await seedPlant("Near");
    const fartherId = await seedPlant("Farther");

    await seedWatering(closestId, new Date(time - 3 * DAY));
    await seedWatering(closestId, new Date(time - 6 * DAY));

    await seedWatering(nearId, new Date(time - 6 * DAY));
    await seedWatering(nearId, new Date(time - 13 * DAY));

    await seedWatering(fartherId, new Date(time - 10 * DAY));
    await seedWatering(fartherId, new Date(time - 17 * DAY));

    const result = await getPlants();
    const ids = result.map((p) => p.id);

    expect(ids.indexOf(fartherId)).toBeLessThan(ids.indexOf(closestId));
    expect(ids.indexOf(closestId)).toBeLessThan(ids.indexOf(nearId));
  });
});
