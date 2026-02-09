"use client";

import { css } from "../../styled-system/css";
import { Plant } from "./Plant.tsx";
import type { PlantWithStats } from "../types.ts";

const containerStyles = css({
  marginBottom: "40px",
});

const listStyles = css({
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gridTemplateColumns: "auto auto auto",
  justifyContent: "space-between",
  alignItems: "stretch",
});

const noPlantsStyles = css({
  textAlign: "center",
  color: "palette.textPlaceholder",
  fontStyle: "italic",
  padding: "20px",
});

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  const parsedTransition = plants.map((plant, index) => {
    const nextPlant = plants[index + 1];
    const isTransition =
      plant.daysUntilNextWatering !== null &&
      plant.daysUntilNextWatering < 0 &&
      nextPlant &&
      nextPlant.daysUntilNextWatering !== null &&
      nextPlant.daysUntilNextWatering >= 0;

    return { plant, isTransition };
  });

  return (
    <div className={containerStyles}>
      {plants.length > 0 ? (
        <ul className={listStyles}>
          {parsedTransition.map(({ plant, isTransition }) => {
            return (
              <Plant key={plant.id} plant={plant} isTransition={isTransition} />
            );
          })}
        </ul>
      ) : (
        <p className={noPlantsStyles}>
          No plants yet. Add your first plant below!
        </p>
      )}
    </div>
  );
}
