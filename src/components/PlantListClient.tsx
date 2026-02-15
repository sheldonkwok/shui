"use client";

import { cva } from "class-variance-authority";
import type { PlantWithStats } from "../types.ts";
import { Plant } from "./Plant.tsx";

const container = cva("mb-10");
const list = cva("list-none p-0 m-0 grid grid-cols-[auto_auto] justify-between items-stretch");
const noPlants = cva("text-center text-[#6c757d] italic p-5");

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
