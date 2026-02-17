import { sql } from "drizzle-orm";
import { getDB } from "./db.ts";
import { plants, waterings } from "./schema.ts";

export async function cleanupTestDB() {
  const db = getDB();
  await db.delete(waterings);
  await db.delete(plants);
  // Reset sequences so IDs are predictable
  await db.execute(sql`ALTER SEQUENCE plants_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE waterings_id_seq RESTART WITH 1`);
}

export async function seedPlant(name: string): Promise<number> {
  const db = getDB();

  const result = await db.insert(plants).values({ name }).returning();

  return result[0]!.id;
}

export async function seedWatering(plantId: number, wateringTime: Date) {
  const db = getDB();
  await db.insert(waterings).values({
    plantId,
    wateringTime,
  });
}
