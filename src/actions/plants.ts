"use server";

import { eq } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plants } from "../schema.ts";
import { listPlants } from "./plants-helper.ts";

export async function classifyPlant(
  plantId: number,
  species: string,
): Promise<{ ok: true } | { error: string }> {
  const gbifRes = await fetch(
    `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(species)}&strict=true`,
  );
  const gbifData = await gbifRes.json();
  if (gbifData.matchType === "NONE") {
    return { error: "Species not found" };
  }
  await getDB().update(plants).set({ species }).where(eq(plants.id, plantId));
  return { ok: true };
}

export async function getPlants() {
  const plantsList = await listPlants();

  const results = plantsList
    .map((plant) => ({
      id: plant.id,
      name: plant.name,
      species: plant.species ?? null,
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
