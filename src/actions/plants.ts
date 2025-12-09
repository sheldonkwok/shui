"use server";

import { eq, count, max, asc, desc } from "drizzle-orm";

import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";
import { calculateIntervals } from "./plants-helper.ts";

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

  // Fetch all watering records to calculate intervals
  const recentWaterings = await getDB()
    .select({
      plantId: waterings.plantId,
      wateringTime: waterings.wateringTime,
    })
    .from(waterings)
    .orderBy(desc(waterings.wateringTime));

  // Calculate average intervals
  const wateringIntervals = calculateIntervals(recentWaterings);

  // Convert timestamps to Date objects and add interval data
  return data.map((plant) => ({
    id: plant.id,
    name: plant.name,
    wateringCount: plant.wateringCount,
    lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : null,
    avgWateringIntervalDays: wateringIntervals[plant.id] ?? null,
  }));
}

export async function addPlant(name: string) {
  await getDB().insert(plants).values({ name });
}

export async function waterPlant(plantId: number) {
  await getDB().insert(waterings).values({ plantId });
}
