import { asc, count, eq, max, sql } from "drizzle-orm";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

export async function listPlants() {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      wateringCount: count(waterings.id),
      lastWatered: max(waterings.wateringTime),
      lastFertilized: sql<
        number | null
      >`MAX(CASE WHEN ${waterings.fertilized} = 1 THEN ${waterings.wateringTime} END)`,
    })
    .from(plants)
    .leftJoin(waterings, eq(plants.id, waterings.plantId))
    .groupBy(plants.id)
    .orderBy(asc(max(waterings.wateringTime)));

  return data;
}

export async function listRecentWaterings() {
  const data = await getDB().all<{
    plantId: number;
    wateringTime: number;
  }>(sql`
    WITH ranked_waterings AS (
      SELECT
        plant_id,
        watering_time,
        ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY watering_time DESC) as row_num
      FROM waterings
    )
    SELECT plant_id as plantId, watering_time as wateringTime
    FROM ranked_waterings
    WHERE row_num <= 5
    ORDER BY watering_time DESC
  `);

  // Convert timestamps to Date objects to match the expected return type
  return data.map((record) => ({
    plantId: record.plantId,
    wateringTime: new Date(record.wateringTime * 1000),
  }));
}

export interface WaterRecord {
  plantId: number;
  wateringTime: Date;
}

export function calculateIntervals(wateringRecords: Array<WaterRecord>): Record<number, number | null> {
  // Group waterings by plantId
  const byPlant: Record<number, Array<WaterRecord>> = {};

  for (const record of wateringRecords) {
    if (!byPlant[record.plantId]) {
      byPlant[record.plantId] = [];
    }
    byPlant[record.plantId]?.push(record);
  }

  const intervals: Record<number, number | null> = {};

  for (const [plantIdStr, records] of Object.entries(byPlant)) {
    const plantId = Number(plantIdStr);

    // Need at least 2 waterings to calculate an interval
    if (records.length < 2) {
      intervals[plantId] = null;
      continue;
    }

    // Calculate intervals between consecutive waterings
    const diffs: number[] = [];
    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      if (!current || !next) continue;
      const diffMs = current.wateringTime.getTime() - next.wateringTime.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      diffs.push(diffDays);
    }

    // Calculate average and round to 1 decimal place
    const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
    intervals[plantId] = Math.round(avg * 10) / 10;
  }

  return intervals;
}
