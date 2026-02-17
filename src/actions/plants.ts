"use server";

import { eq } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";
import { listPlants, refreshWateringSummary } from "./plants-helper.ts";

export async function getPlants() {
  const plantsList = await listPlants();

  // Calculate days until next watering
  const now = new Date();
  const results = plantsList
    .map((plant) => {
      const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
      const avgInterval = plant.avgIntervalDays ?? null;
      const lastFertilized = plant.lastFertilized ?? null;

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
    })
    .sort((a, b) => {
      if (a.daysUntilNextWatering === b.daysUntilNextWatering) return 0;
      if (a.daysUntilNextWatering === null) return 1;
      if (b.daysUntilNextWatering === null) return -1;
      return a.daysUntilNextWatering - b.daysUntilNextWatering;
    });

  return results;
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

  await refreshWateringSummary();
}
