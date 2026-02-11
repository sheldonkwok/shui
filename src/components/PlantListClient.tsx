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
  gridTemplateColumns: "auto auto",
  justifyContent: "space-between",
  alignItems: "stretch",
});

const noPlantsStyles = css({
  textAlign: "center",
  color: "#6c757d",
  fontStyle: "italic",
  padding: "20px",
});

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  return (
    <div className={containerStyles}>
      {plants.length > 0 ? (
        <ul className={listStyles}>
          {plants.map((plant) => {
            return <Plant key={plant.id} plant={plant} />;
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
