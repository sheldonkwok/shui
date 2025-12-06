"use server";

import { eq, count, max, asc, desc } from "drizzle-orm";

import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

export interface WaterRecord {
  plantId: number;
  wateringTime: Date;
}

export async function calculateIntervals(
  wateringRecords: Array<WaterRecord>
): Promise<Record<number, number | null>> {
  // Group waterings by plantId
  const byPlant: Record<number, Array<WaterRecord>> = {};

  for (const record of wateringRecords) {
    if (!byPlant[record.plantId]) {
      byPlant[record.plantId] = [];
    }
    byPlant[record.plantId]!.push(record);
  }

  const intervals: Record<number, number | null> = {};

  for (const [plantIdStr, records] of Object.entries(byPlant)) {
    const plantId = Number(plantIdStr);

    // Sort by time descending (most recent first) and take top 5
    const recent5 = records
      .sort((a, b) => b.wateringTime.getTime() - a.wateringTime.getTime())
      .slice(0, 5);

    // Need at least 2 waterings to calculate an interval
    if (recent5.length < 2) {
      intervals[plantId] = null;
      continue;
    }

    // Calculate intervals between consecutive waterings
    const diffs: number[] = [];
    for (let i = 0; i < recent5.length - 1; i++) {
      const diffMs =
        recent5[i]!.wateringTime.getTime() -
        recent5[i + 1]!.wateringTime.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      diffs.push(diffDays);
    }

    // Calculate average and round to 1 decimal place
    const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
    intervals[plantId] = Math.round(avg * 10) / 10;
  }

  return intervals;
}

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
  const wateringIntervals = await calculateIntervals(recentWaterings);

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
