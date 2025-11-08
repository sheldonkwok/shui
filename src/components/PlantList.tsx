import { Plant } from "./Plant.tsx";
import { getPlants } from "../actions/plants.ts";

export async function PlantList() {
  const plants = await getPlants();

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
