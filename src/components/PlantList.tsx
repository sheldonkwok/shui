import { eq, count, max } from "drizzle-orm";

import { Plant } from "./Plant.tsx";
import type { PlantWithStats } from "../types.ts";
import { getDB } from "../db.ts";
import { plants, waterings } from "../schema.ts";

async function fetchPlants(): Promise<PlantWithStats[]> {
  const data = await getDB()
    .select({
      id: plants.id,
      name: plants.name,
      wateringCount: count(waterings.id),
      lastWatered: max(waterings.wateringTime),
    })
    .from(plants)
    .leftJoin(waterings, eq(plants.id, waterings.plantId))
    .groupBy(plants.id);

  // Convert timestamps to Date objects
  return data.map((plant) => ({
    id: plant.id,
    name: plant.name,
    wateringCount: plant.wateringCount,
    lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : null,
  }));
}

export async function PlantList() {
  const plants = await fetchPlants();

  return (
    <div className="plant-list">
      {plants.length > 0 ? (
        <ul>
          {plants.map((plant) => (
            <Plant key={plant.id} plant={plant} />
          ))}
        </ul>
      ) : (
        <p className="no-plants">No plants yet. Add your first plant below!</p>
      )}
    </div>
  );
}
