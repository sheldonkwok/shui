import { sql } from "drizzle-orm";
import { getDB } from "./db.ts";
import { plantDelays, plants, wateringSummary, waterings } from "./schema.ts";

export async function cleanupTestDB() {
  const db = getDB();
  await db.delete(plantDelays);
  await db.delete(waterings);
  await db.delete(plants);
  // Reset sequences so IDs are predictable
  await db.execute(sql`ALTER SEQUENCE plants_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE waterings_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE plant_delays_id_seq RESTART WITH 1`);
  await db.refreshMaterializedView(wateringSummary);
}

export async function seedPlant(name: string): Promise<number> {
  const db = getDB();

  const result = await db.insert(plants).values({ name }).returning();

  return result[0]!.id;
}

export async function seedWatering(plantId: number, wateringTime: Date, fertilized = false) {
  const db = getDB();
  await db.insert(waterings).values({
    plantId,
    wateringTime,
    fertilized,
  });
  await db.refreshMaterializedView(wateringSummary);
}

export async function seedDelay(plantId: number, numDays: number, dateAdded: Date) {
  const db = getDB();
  await db.insert(plantDelays).values({ plantId, numDays, dateAdded });
}
