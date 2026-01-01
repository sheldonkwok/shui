import { getPlants } from "../actions/plants.ts";
import { PlantListClient } from "./PlantListClient.tsx";

export async function PlantList() {
  const plants = await getPlants();

  return <PlantListClient plants={plants} />;
}
