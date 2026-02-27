import { asc, eq, sql } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plantDelays, plants, wateringSummary } from "../schema.ts";

export async function listPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
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
    .orderBy(asc(wateringSummary.lastWatered));

  return data;
}

export async function refreshWateringSummary() {
  await getDB().refreshMaterializedView(wateringSummary);
}
