import { Plant } from "./Plant.tsx";
import { getPlants } from "../actions/plants.ts";
import styles from "./PlantList.module.css";

export async function PlantList() {
  const plants = await getPlants();

  return (
    <div className={styles["container"]}>
      {plants.length > 0 ? (
        <ul className={styles["list"]}>
          {plants.map((plant, index) => {
            // Detect if this is the last overdue plant (transition point)
            const nextPlant = plants[index + 1];
            const isLastOverdue =
              plant.daysUntilNextWatering !== null &&
              plant.daysUntilNextWatering < 0 &&
              nextPlant &&
              nextPlant.daysUntilNextWatering !== null &&
              nextPlant.daysUntilNextWatering >= 0;

            return (
              <Plant
                key={plant.id}
                plant={plant}
                isTransition={isLastOverdue}
              />
            );
          })}
        </ul>
      ) : (
        <p className={styles["noPlants"]}>
          No plants yet. Add your first plant below!
        </p>
      )}
    </div>
  );
}
