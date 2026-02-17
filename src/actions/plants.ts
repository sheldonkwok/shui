"use server";

import { eq } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";
import { calculateIntervals, listPlants, listRecentWaterings } from "./plants-helper.ts";

export async function getPlants() {
  // Seems to run into a cold start issue for both going at once
  const plantsList = await listPlants();
  const recentWaterings = await listRecentWaterings();

  // Calculate average intervals
  const wateringIntervals = calculateIntervals(recentWaterings);

  // Derive lastFertilized per plant from recentWaterings
  const lastFertilizedByPlant: Record<number, Date | null> = {};
  for (const record of recentWaterings) {
    if (record.fertilized) {
      const existing = lastFertilizedByPlant[record.plantId];
      if (!existing || record.wateringTime > existing) {
        lastFertilizedByPlant[record.plantId] = record.wateringTime;
      }
    }
  }

  // Calculate days until next watering
  const now = new Date();
  const results = plantsList.map((plant) => {
    const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
    const lastFertilized = lastFertilizedByPlant[plant.id] ?? null;
    const avgInterval = wateringIntervals[plant.id] ?? null;

    let daysUntilNextWatering: number | null = null;
    if (lastWatered && avgInterval !== null) {
      const daysSinceWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24);
      daysUntilNextWatering = Math.round((avgInterval - daysSinceWatered) * 10) / 10;
    }

    return {
      id: plant.id,
      name: plant.name,
      wateringCount: plant.wateringCount,
      lastWatered,
      lastFertilized,
      avgWateringIntervalDays: avgInterval,
      daysUntilNextWatering,
    };
  });

  // Sort by daysUntilNextWatering ascending (null values last)
  return results.sort((a, b) => {
    if (a.daysUntilNextWatering === null && b.daysUntilNextWatering === null) return 0;
    if (a.daysUntilNextWatering === null) return 1;
    if (b.daysUntilNextWatering === null) return -1;
    return a.daysUntilNextWatering - b.daysUntilNextWatering;
  });
}

export async function addPlant(name: string) {
  await getDB().insert(plants).values({ name });
}

export async function renamePlant(plantId: number, newName: string) {
  await getDB().update(plants).set({ name: newName }).where(eq(plants.id, plantId));
}

export async function waterPlant(plantId: number, fertilized = false) {
  await getDB().insert(waterings).values({
    plantId,
    fertilized,
  });
}
