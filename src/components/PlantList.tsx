import { getGarden } from "../actions/garden.ts";
import { getPlants } from "../actions/plants.ts";
import { PlantListClient } from "./PlantListClient.tsx";

export async function PlantList() {
  const [plants, garden] = await Promise.all([getPlants(), getGarden()]);

  return <PlantListClient plants={plants} garden={garden} />;
}
