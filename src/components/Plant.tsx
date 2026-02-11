"use client";

import { useState } from "react";
import { css } from "../../styled-system/css";
import type { PlantWithStats } from "../types.ts";
import { PlantActionsDialog } from "./PlantActionsDialog.tsx";

interface PlantProps {
  plant: PlantWithStats;
}

const plantItemStyles = css({
  display: "contents",
  _after: {
    content: '""',
    gridColumn: "1 / -1",
    height: "1px",
    background:
      "linear-gradient(to right, var(--border-color), var(--water-gradient-color))",
  },
});

const clickableCellStyles = css({
  cursor: "pointer",
});

const plantNameStyles = css({
  fontWeight: 500,
  color: "#2d5f3f",
  fontSize: "1em",
  display: "flex",
  alignItems: "center",
  padding: "0.1em 0",
});

const lastWateredStyles = css({
  color: "#999",
  fontSize: "0.8em",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  padding: "0.1em 0",
});

const WATER_COLOR_RGB = "109, 148, 197";
const BORDER_COLOR = "#e9ecef";
const MAX_DAYS_SCALE = 4;

function getWaterRatio(daysUntilNextWatering: number | null): number {
  if (daysUntilNextWatering === null) return 0;
  if (daysUntilNextWatering <= 0) return 1;
  if (daysUntilNextWatering >= MAX_DAYS_SCALE) return 0;
  return 1 - daysUntilNextWatering / MAX_DAYS_SCALE;
}

const WEEK = 7;

const formatLastWatered = (date: Date | null) => {
  if (!date) return "Never watered";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= WEEK * 3) return `${diffDays} days ago`;

  return `${Math.floor(diffDays / WEEK)} weeks ago`;
};

export function Plant({ plant }: PlantProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ratio = getWaterRatio(plant.daysUntilNextWatering);

  return (
    <li
      className={plantItemStyles}
      style={{
        '--border-color': BORDER_COLOR,
        '--water-gradient-color': `rgba(${WATER_COLOR_RGB}, ${ratio})`,
      } as React.CSSProperties}
    >
      <span
        className={`${plantNameStyles} ${clickableCellStyles}`}
        onClick={() => setIsDialogOpen(true)}
      >
        {plant.name}
      </span>
      <span
        className={`${lastWateredStyles} ${clickableCellStyles}`}
        onClick={() => setIsDialogOpen(true)}
      >
        {formatLastWatered(plant.lastWatered)}
      </span>
      <PlantActionsDialog
        plantId={plant.id}
        plantName={plant.name}
        lastFertilized={plant.lastFertilized}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </li>
  );
}
