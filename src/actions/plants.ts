"use server";

import { listPlants } from "./plants-helper.ts";

export async function getPlants() {
  const plantsList = await listPlants();

  const results = plantsList
    .map((plant) => ({
      id: plant.id,
      name: plant.name,
      wateringCount: plant.wateringCount,
      lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : null,
      lastFertilized: plant.lastFertilized ?? null,
      avgWateringIntervalDays: plant.avgIntervalDays ?? null,
      daysUntilNextWatering: plant.daysUntilNextWatering,
    }))
    .sort((a, b) => {
      if (a.daysUntilNextWatering === b.daysUntilNextWatering) return 0;
      if (a.daysUntilNextWatering === null) return 1;
      if (b.daysUntilNextWatering === null) return -1;
      return a.daysUntilNextWatering - b.daysUntilNextWatering;
    });

  return results;
}
