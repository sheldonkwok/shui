"use client";

import { cva } from "class-variance-authority";
import { TreeDeciduous } from "lucide-react";
import { useState } from "react";
import { cls, colors } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { getWaterRatio } from "../water-utils.ts";
import { PlantActionsDialog } from "./PlantActionsDialog";

const cardWrapper = cva("rounded-lg p-[2px] cursor-pointer");
const cardInner = cva(
  "rounded-[calc(0.5rem-2px)] bg-[#fffdf6] h-full flex flex-col items-center justify-center relative aspect-square overflow-hidden",
);
const cardIcon = cva("w-3/4 h-3/4 text-gray-300");
const cardName = cva([
  cls.textPrimaryGreen,
  "absolute inset-0 flex items-center justify-center text-center font-medium text-sm px-2 line-clamp-2 select-none",
]);

interface PlantCardProps {
  plant: PlantWithStats;
}

export function PlantCard({ plant }: PlantCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ratio = getWaterRatio(plant.daysUntilNextWatering);

  return (
    <li
      className={cardWrapper()}
      style={{
        background: `linear-gradient(135deg, ${colors.borderList}, rgba(${colors.waterBlueRgb}, ${ratio}))`,
      }}
    >
      <button type="button" className={cardInner()} onClick={() => setIsDialogOpen(true)}>
        <TreeDeciduous className={cardIcon()} />
        <span className={cardName()}>{plant.name}</span>
      </button>
      <PlantActionsDialog
        plantId={plant.id}
        plantName={plant.name}
        species={plant.species}
        lastWatered={plant.lastWatered}
        lastFertilized={plant.lastFertilized}
        avgWateringIntervalDays={plant.avgWateringIntervalDays}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </li>
  );
}
