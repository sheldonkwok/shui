"use server";

import { listPlants } from "./plants-helper.ts";

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
