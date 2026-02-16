"use client";

import { cva } from "class-variance-authority";
import { useState } from "react";
import type { PlantWithStats } from "../types.ts";
import { formatCalendarDaysAgo } from "../utils.ts";
import { PlantActionsDialog } from "./PlantActionsDialog.tsx";

interface PlantProps {
  plant: PlantWithStats;
}

const plantItem = cva(
  "contents after:content-[''] after:col-span-full after:h-px after:[background:linear-gradient(to_right,var(--border-color),var(--water-gradient-color))]",
);
const plantName = cva(
  "bg-transparent border-none text-left font-medium text-[#2d5f3f] text-base flex items-center py-[0.1em] select-none cursor-pointer",
);
const lastWatered = cva(
  "bg-transparent border-none text-left text-[#999] text-[0.8em] whitespace-nowrap flex items-center py-[0.1em] cursor-pointer",
);

const WATER_COLOR_RGB = "109, 148, 197";
const BORDER_COLOR = "#e9ecef";
const MAX_DAYS_SCALE = 4;

function getWaterRatio(daysUntilNextWatering: number | null): number {
  if (daysUntilNextWatering === null) return 0;
  if (daysUntilNextWatering <= 0) return 1;
  if (daysUntilNextWatering >= MAX_DAYS_SCALE) return 0;
  return 1 - daysUntilNextWatering / MAX_DAYS_SCALE;
}

const formatLastWatered = (date: Date | null) => {
  if (!date) return "Never watered";
  return formatCalendarDaysAgo(date);
};

export function Plant({ plant }: PlantProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ratio = getWaterRatio(plant.daysUntilNextWatering);

  return (
    <li
      className={plantItem()}
      style={
        {
          "--border-color": BORDER_COLOR,
          "--water-gradient-color": `rgba(${WATER_COLOR_RGB}, ${ratio})`,
        } as React.CSSProperties
      }
    >
      <button type="button" className={plantName()} onClick={() => setIsDialogOpen(true)}>
        {plant.name}
      </button>
      <button type="button" className={lastWatered()} onClick={() => setIsDialogOpen(true)}>
        {formatLastWatered(plant.lastWatered)}
      </button>
      <PlantActionsDialog
        plantId={plant.id}
        plantName={plant.name}
        lastWatered={plant.lastWatered}
        lastFertilized={plant.lastFertilized}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </li>
  );
}
