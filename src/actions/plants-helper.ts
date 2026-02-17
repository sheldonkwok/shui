import { asc, eq, sql } from "drizzle-orm";
import { getDB } from "../db.ts";
import { avgWateringIntervals, plants } from "../schema.ts";

export async function listPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      wateringCount: sql<number>`COALESCE(${avgWateringIntervals.wateringCount}, 0)`,
      lastWatered: avgWateringIntervals.lastWatered,
    })
    .from(plants)
    .leftJoin(avgWateringIntervals, eq(plants.id, avgWateringIntervals.plantId))
    .orderBy(asc(avgWateringIntervals.lastWatered));

  return data;
}

export async function refreshAvgIntervals() {
  await getDB().refreshMaterializedView(avgWateringIntervals);
}

export async function getAvgIntervals(): Promise<
  Record<number, { avgIntervalDays: number | null; lastFertilized: Date | null }>
> {
  const rows = await getDB().select().from(avgWateringIntervals);

  const result: Record<number, { avgIntervalDays: number | null; lastFertilized: Date | null }> = {};
  for (const row of rows) {
    if (row.plantId !== null) {
      result[row.plantId] = {
        avgIntervalDays: row.avgIntervalDays,
        lastFertilized: row.lastFertilized,
      };
    }
  }
  return result;
}
