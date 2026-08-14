"use client";

import { cva } from "class-variance-authority";
import { useMemo } from "react";
import { cls } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { Plant } from "./Plant.tsx";

const container = cva("mb-10");
// pt-[52px] reserves room above the panel for the logo mark, which sinks
// 12px into the panel's top edge (64px mark, 52px of it stays above).
const panelWrap = cva("relative pt-[52px]");
const logoMark = cva("absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 z-10 [image-rendering:pixelated]");
const panelCard = cva([cls.bgPageBackground, "rounded-[20px] shadow-sm overflow-hidden pt-[14px] pb-1.5"]);
const list = cva("list-none p-0 m-0");
const noPlants = cva(["text-center italic p-5", cls.textMuted]);

/** Thirst band: 0 = thirsty, 1 = coming up, 2 = settled. */
function thirstBand(daysUntilNextWatering: number | null): number {
  if (daysUntilNextWatering === null) return 2;
  if (daysUntilNextWatering <= 1) return 0;
  if (daysUntilNextWatering <= 3) return 1;
  return 2;
}

/** Sorts thirstiest-first, flagging rows where the thirst band changes so a silent gap can be rendered. */
function sortByThirst(plants: PlantWithStats[]) {
  const sorted = [...plants].sort((a, b) => {
    const daysA = a.daysUntilNextWatering ?? Number.POSITIVE_INFINITY;
    const daysB = b.daysUntilNextWatering ?? Number.POSITIVE_INFINITY;
    return daysA - daysB;
  });
  return sorted.map((plant, i) => ({
    plant,
    gap:
      i > 0 && thirstBand(plant.daysUntilNextWatering) !== thirstBand(sorted[i - 1]!.daysUntilNextWatering),
  }));
}

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  const sortedPlants = useMemo(() => sortByThirst(plants), [plants]);

  return (
    <div className={container()}>
      {plants.length > 0 ? (
        <div className={panelWrap()}>
          <img src="/shui.png" alt="Shui" className={logoMark()} />
          <div className={panelCard()}>
            <ul className={list()}>
              {sortedPlants.map(({ plant, gap }) => (
                <Plant key={plant.id} plant={plant} gap={gap} />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className={noPlants()}>No plants yet. Add your first plant below!</p>
      )}
    </div>
  );
}
