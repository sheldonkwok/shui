"use server";

import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";
import {
  calculateIntervals,
  listPlants,
  listRecentWaterings,
} from "./plants-helper.ts";

export async function getPlants() {
  const [data, recentWaterings] = await Promise.all([
    listPlants(),
    listRecentWaterings(),
  ]);

  // Calculate average intervals
  const wateringIntervals = calculateIntervals(recentWaterings);

  // Convert timestamps to Date objects and calculate days until next watering
  const now = new Date();
  const results = data.map((plant) => {
    const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
    const avgInterval = wateringIntervals[plant.id] ?? null;

    let daysUntilNextWatering: number | null = null;
    if (lastWatered && avgInterval !== null) {
      const daysSinceWatered =
        (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24);
      daysUntilNextWatering =
        Math.round((avgInterval - daysSinceWatered) * 10) / 10;
    }

    return {
      id: plant.id,
      name: plant.name,
      wateringCount: plant.wateringCount,
      lastWatered,
      avgWateringIntervalDays: avgInterval,
      daysUntilNextWatering,
    };
  });

  // Sort by daysUntilNextWatering ascending (null values last)
  return results.sort((a, b) => {
    if (a.daysUntilNextWatering === null && b.daysUntilNextWatering === null)
      return 0;
    if (a.daysUntilNextWatering === null) return 1;
    if (b.daysUntilNextWatering === null) return -1;
    return a.daysUntilNextWatering - b.daysUntilNextWatering;
  });
}

export async function addPlant(name: string) {
  await getDB().insert(plants).values({ name });
}

export async function waterPlant(plantId: number) {
  await getDB().insert(waterings).values({ plantId });
}
