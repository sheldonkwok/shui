import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plantDelays, plants, wateringSummary, waterings } from "../schema.ts";

export async function listPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      species: plants.species,
      wateringCount: sql<number>`COALESCE(${wateringSummary.wateringCount}, 0)`,
      lastWatered: wateringSummary.lastWatered,
      avgIntervalDays: wateringSummary.avgIntervalDays,
      lastFertilized: wateringSummary.lastFertilized,
      daysUntilNextWatering: sql<number | null>`
        CASE
          WHEN ${wateringSummary.avgIntervalDays} IS NOT NULL
           AND ${wateringSummary.lastWatered} IS NOT NULL
          THEN ROUND(
            (
              ${wateringSummary.avgIntervalDays}::numeric
              - EXTRACT(EPOCH FROM (NOW() - ${wateringSummary.lastWatered})) / 86400
              + CASE
                  WHEN ${plantDelays.numDays} IS NOT NULL
                   AND EXTRACT(EPOCH FROM (NOW() - ${plantDelays.dateAdded})) / 86400
                       < ${plantDelays.numDays}
                  THEN ${plantDelays.numDays}::numeric
                  ELSE 0
                END
            ),
            1
          )::float
          ELSE NULL
        END
      `,
    })
    .from(plants)
    .leftJoin(wateringSummary, eq(plants.id, wateringSummary.plantId))
    .leftJoin(plantDelays, eq(plants.id, plantDelays.plantId))
    .where(isNull(plants.deletedAt))
    .orderBy(asc(wateringSummary.lastWatered));

  return data;
}

export async function refreshWateringSummary() {
  await getDB().refreshMaterializedView(wateringSummary);
}

/** Raw watering events for a plant within the last `days` days, oldest first. */
export async function getWateringHistory(plantId: number, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return getDB()
    .select({ id: waterings.id, wateringTime: waterings.wateringTime, fertilized: waterings.fertilized })
    .from(waterings)
    .where(and(eq(waterings.plantId, plantId), gte(waterings.wateringTime, since)))
    .orderBy(asc(waterings.wateringTime));
}

/** Flips the fertilized flag on a single watering. Returns false if it isn't this plant's. */
export async function setWateringFertilized(plantId: number, wateringId: number, fertilized: boolean) {
  const updated = await getDB()
    .update(waterings)
    .set({ fertilized })
    .where(and(eq(waterings.id, wateringId), eq(waterings.plantId, plantId)))
    .returning();
  return updated.length > 0;
}

/** Removes a single watering. Returns false if it isn't this plant's. */
export async function deleteWatering(plantId: number, wateringId: number) {
  const deleted = await getDB()
    .delete(waterings)
    .where(and(eq(waterings.id, wateringId), eq(waterings.plantId, plantId)))
    .returning();
  return deleted.length > 0;
}
