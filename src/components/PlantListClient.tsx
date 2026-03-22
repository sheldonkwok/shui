"use client";

import { cva } from "class-variance-authority";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { cls } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { Plant } from "./Plant.tsx";
import { PlantCard } from "./PlantCard.tsx";
import { ButtonGroup } from "./ui/ButtonGroup.tsx";
import { Toggle } from "./ui/Toggle.tsx";

const container = cva("mb-10");
const toolbar = cva("flex justify-end mb-2");
const list = cva("list-none p-0 m-0");
const grid = cva("list-none p-0 m-0 grid grid-cols-2 sm:grid-cols-3 gap-3");
const noPlants = cva(["text-center italic p-5", cls.textMuted]);

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className={container()}>
      {plants.length > 0 ? (
        <>
          <div className={toolbar()}>
            <ButtonGroup>
              <Toggle
                variant="outline"
                size="sm"
                pressed={viewMode === "list"}
                onPressedChange={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Toggle>
              <Toggle
                variant="outline"
                size="sm"
                pressed={viewMode === "grid"}
                onPressedChange={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Toggle>
            </ButtonGroup>
          </div>
          {viewMode === "list" ? (
            <ul className={list()}>
              {plants.map((plant) => (
                <Plant key={plant.id} plant={plant} />
              ))}
            </ul>
          ) : (
            <ul className={grid()}>
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className={noPlants()}>No plants yet. Add your first plant below!</p>
      )}
    </div>
  );
}
