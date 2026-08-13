"use client";

import { cva } from "class-variance-authority";
import { useState } from "react";
import { cls, colors } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { formatCalendarDaysAgo } from "../utils.ts";
import { getExpectedDayRatio } from "../water-utils.ts";
import { PlantActionsDialog } from "./PlantActionsDialog";

interface PlantProps {
  plant: PlantWithStats;
  /** Renders a silent 14px spacer before the row — marks a thirst-band change. */
  gap?: boolean;
}

const gapSpacer = cva("h-[14px]");
const plantItem = cva("flex items-center gap-3 h-[46px] pl-3 pr-[18px]");
const gaugeTrack = cva([
  cls.bgBorderList,
  "w-1 h-6 rounded-full flex flex-col justify-end overflow-hidden shrink-0",
]);
const plantName = cva([
  cls.textPrimaryGreen,
  "flex-1 min-w-0 bg-transparent border-none text-left font-medium text-base truncate select-none cursor-pointer focus:outline-none active:bg-transparent [-webkit-tap-highlight-color:transparent]",
]);
const lastWatered = cva([
  cls.textSecondary,
  "bg-transparent border-none text-left text-[13px] whitespace-nowrap flex items-center cursor-pointer select-none focus:outline-none active:bg-transparent [-webkit-tap-highlight-color:transparent]",
]);

const formatLastWatered = (date: Date | null) => {
  if (!date) return "Never watered";
  return formatCalendarDaysAgo(date);
};

export function Plant({ plant, gap = false }: PlantProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ratio = getExpectedDayRatio(plant.daysUntilNextWatering, plant.avgWateringIntervalDays);

  return (
    <>
      {gap && <li aria-hidden="true" className={gapSpacer()} />}
      <li className={plantItem()}>
        <div className={gaugeTrack()}>
          <div
            style={{
              width: "100%",
              height: `${Math.max(ratio, 0.08) * 100}%`,
              background: `rgba(${colors.waterBlueRgb}, ${ratio || 0.15})`,
              borderRadius: "999px",
            }}
          />
        </div>
        <button type="button" className={plantName()} onClick={() => setIsDialogOpen(true)}>
          {plant.name}
        </button>
        <button type="button" className={lastWatered()} onClick={() => setIsDialogOpen(true)}>
          {formatLastWatered(plant.lastWatered)}
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
    </>
  );
}
