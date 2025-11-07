"use server";

import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

export async function addPlant(name: string) {
  // Insert plant into database
  await getDB().insert(plants).values({ name });
}

export async function waterPlant(plantId: number) {
  await getDB().insert(waterings).values({ plantId });
}
