import { unstable_getHeaders as getHeaders } from "waku/router/server";
import { getPlants } from "../actions/plants.ts";
import { isLoggedIn } from "../auth.ts";
import { PlantListClient } from "./PlantListClient.tsx";

export async function PlantList() {
  const [plants, loggedIn] = await Promise.all([getPlants(), isLoggedIn(getHeaders())]);

  return <PlantListClient plants={plants} loggedIn={loggedIn} />;
}
