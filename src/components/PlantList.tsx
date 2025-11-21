import { Plant } from "./Plant.tsx";
import { getPlants } from "../actions/plants.ts";
import styles from "./PlantList.module.css";

export async function PlantList() {
  const plants = await getPlants();

  return (
    <div className={styles["container"]}>
      {plants.length > 0 ? (
        <ul className={styles["list"]}>
          {plants.map((plant) => (
            <Plant key={plant.id} plant={plant} />
          ))}
        </ul>
      ) : (
        <p className={styles["noPlants"]}>
          No plants yet. Add your first plant below!
        </p>
      )}
    </div>
  );
}
