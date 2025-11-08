"use server";

import { eq, count, max, asc } from "drizzle-orm";

import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

export async function getPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      wateringCount: count(waterings.id),
      lastWatered: max(waterings.wateringTime),
    })
    .from(plants)
    .leftJoin(waterings, eq(plants.id, waterings.plantId))
    .groupBy(plants.id)
    .orderBy(asc(max(waterings.wateringTime)));

  // Convert timestamps to Date objects
  return data.map((plant) => ({
    id: plant.id,
    name: plant.name,
    wateringCount: plant.wateringCount,
    lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : null,
  }));
}

export async function addPlant(name: string) {
  await getDB().insert(plants).values({ name });
}

export async function waterPlant(plantId: number) {
  await getDB().insert(waterings).values({ plantId });
}
