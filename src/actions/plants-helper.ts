import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { type DBExecutor, getDB } from "../db.ts";
import { plantDelays, plants, wateringSummary, waterings } from "../schema.ts";

// Days left on the plant's delay, or NULL when it has expired or was never set.
const delayDaysLeft = sql`
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - ${plantDelays.dateAdded})) / 86400
         < ${plantDelays.numDays}
    THEN ${plantDelays.numDays}::numeric
         - EXTRACT(EPOCH FROM (NOW() - ${plantDelays.dateAdded})) / 86400
  END
`;

// Days until the plant's next watering (negative when overdue), or NULL with no watering data.
const daysUntilNextWatering = sql<number | null>`
    CASE
      WHEN ${wateringSummary.avgIntervalDays} IS NOT NULL
       AND ${wateringSummary.lastWatered} IS NOT NULL
      -- An active delay means "next watering is N days from when it was set".
      -- GREATEST skips the NULL from an expired/missing delay and never pulls
      -- the schedule earlier than it already was.
      THEN ROUND(
        GREATEST(
          ${wateringSummary.avgIntervalDays}::numeric
            - EXTRACT(EPOCH FROM (NOW() - ${wateringSummary.lastWatered})) / 86400,
          ${delayDaysLeft}
        ),
        1
      )::float
      ELSE NULL
    END
  `;

/** Active plants, thirstiest first (nulls last), with id as a stable tiebreaker. */
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
      lastRepotted: wateringSummary.lastRepotted,
      daysUntilNextWatering,
      delayDaysRemaining: sql<number | null>`CEIL(${delayDaysLeft})::integer`,
    })
    .from(plants)
    .leftJoin(wateringSummary, eq(plants.id, wateringSummary.plantId))
    .leftJoin(plantDelays, eq(plants.id, plantDelays.plantId))
    .where(isNull(plants.deletedAt))
    .orderBy(sql`${daysUntilNextWatering} ASC NULLS LAST`, asc(plants.id));

  return data;
}

export async function refreshWateringSummary(db: DBExecutor = getDB()) {
  await db.refreshMaterializedView(wateringSummary);
}

/** Raw watering events for a plant within the last `days` days, oldest first. */
export async function getWateringHistory(plantId: number, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return getDB()
    .select({
      id: waterings.id,
      wateringTime: waterings.wateringTime,
      fertilized: waterings.fertilized,
      repot: waterings.repot,
    })
    .from(waterings)
    .where(and(eq(waterings.plantId, plantId), gte(waterings.wateringTime, since)))
    .orderBy(asc(waterings.wateringTime));
}

/** Updates the flags on a single watering. Returns false if it isn't this plant's. */
export async function updateWatering(
  plantId: number,
  wateringId: number,
  patch: { fertilized?: boolean; repot?: boolean },
  db: DBExecutor = getDB(),
) {
  const updated = await db
    .update(waterings)
    .set(patch)
    .where(and(eq(waterings.id, wateringId), eq(waterings.plantId, plantId)))
    .returning();
  return updated.length > 0;
}

/** Removes a single watering. Returns false if it isn't this plant's. */
export async function deleteWatering(plantId: number, wateringId: number, db: DBExecutor = getDB()) {
  const deleted = await db
    .delete(waterings)
    .where(and(eq(waterings.id, wateringId), eq(waterings.plantId, plantId)))
    .returning();
  return deleted.length > 0;
}
