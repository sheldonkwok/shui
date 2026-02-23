"use client";

import { cva } from "class-variance-authority";
import { cls } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { Plant } from "./Plant.tsx";

const container = cva("mb-10");
const list = cva("list-none p-0 m-0");
const noPlants = cva(["text-center italic p-5", cls.textMuted]);

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  return (
    <div className={container()}>
      {plants.length > 0 ? (
        <ul className={list()}>
          {plants.map((plant) => {
            return <Plant key={plant.id} plant={plant} />;
          })}
        </ul>
      ) : (
        <p className={noPlants()}>No plants yet. Add your first plant below!</p>
      )}
    </div>
  );
}
