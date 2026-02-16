import { db } from "./db.ts";
import { plants, waterings } from "./schema.ts";

export async function cleanupTestDB() {

  // Delete all data (schema remains intact)
  await db.delete(waterings);
  await db.delete(plants);
}

export async function seedPlant(name: string): Promise<number> {

  const result = await db.insert(plants).values({ name }).returning({ id: plants.id });

  return result[0].id;
}

export async function seedWatering(plantId: number, wateringTime: Date) {
  await db.insert(waterings).values({
    plantId,
    wateringTime,
  });
}
