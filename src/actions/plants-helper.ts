import { asc, eq, sql } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plants, wateringSummary } from "../schema.ts";

export async function listPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      wateringCount: sql<number>`COALESCE(${wateringSummary.wateringCount}, 0)`,
      lastWatered: wateringSummary.lastWatered,
      avgIntervalDays: wateringSummary.avgIntervalDays,
      lastFertilized: wateringSummary.lastFertilized,
    })
    .from(plants)
    .leftJoin(wateringSummary, eq(plants.id, wateringSummary.plantId))
    .orderBy(asc(wateringSummary.lastWatered));

  return data;
}

export async function refreshWateringSummary() {
  await getDB().refreshMaterializedView(wateringSummary);
}
