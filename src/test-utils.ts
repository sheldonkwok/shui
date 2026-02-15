import { getDB } from "./db.ts";
import { plants, waterings } from "./schema.ts";

export async function cleanupTestDB() {
  const db = getDB();

  // Delete all data (schema remains intact)
  await db.delete(waterings);
  await db.delete(plants);
}

export async function seedPlant(name: string): Promise<number> {
  const db = getDB();

  const result = await db.insert(plants).values({ name }).returning({ id: plants.id });

  return result[0].id;
}

export async function seedWatering(plantId: number, wateringTime: Date) {
  const db = getDB();
  await db.insert(waterings).values({
    plantId,
    wateringTime,
  });
}
