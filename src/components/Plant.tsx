"use client";

import { css } from "../../styled-system/css";
import type { PlantWithStats } from "../types.ts";
import { PlantActionsDialog } from "./PlantActionsDialog.tsx";

interface PlantProps {
  plant: PlantWithStats;
  isTransition?: boolean;
}

const plantItemStyles = css({
  display: "contents",
  _after: {
    content: '""',
    gridColumn: "1 / -1",
    borderBottom: "1px solid #e9ecef",
  },
});

const plantItemTransitionStyles = css({
  display: "contents",
  _after: {
    content: '""',
    gridColumn: "1 / -1",
    borderBottom: "1px solid #6d94c5",
  },
});

const cellStyles = css({
  padding: "3px 0",
});

const buttonCellStyles = css({
  display: "flex",
  alignItems: "center",
});

const plantNameStyles = css({
  fontWeight: 500,
  color: "#2d5f3f",
  fontSize: "1em",
});

const nextWaterStyles = css({
  color: "#999",
  fontSize: "0.8em",
  whiteSpace: "nowrap",
});

const lastWateredStyles = css({
  color: "#999",
  fontSize: "0.8em",
  whiteSpace: "nowrap",
});

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

const formatDaysUntilNext = (days: number | null) => {
  if (days === null) return "—";

  if (days < 0) {
    return `${Math.abs(days)} days`;
  } else if (days === 0) {
    return "Due today";
  } else if (days < 1) {
    return "< 1 day";
  } else if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
};

export function Plant({ plant, isTransition = false }: PlantProps) {
  return (
    <li
      className={
        isTransition ? plantItemTransitionStyles : plantItemStyles
      }
    >
      <span className={`${plantNameStyles} ${cellStyles}`}>{plant.name}</span>
      <span className={`${nextWaterStyles} ${cellStyles}`}>
        {formatDaysUntilNext(plant.daysUntilNextWatering)}
      </span>
      <span className={`${lastWateredStyles} ${cellStyles}`}>
        {formatLastWatered(plant.lastWatered)}
      </span>
      <div className={buttonCellStyles}>
        <PlantActionsDialog plantId={plant.id} plantName={plant.name} />
      </div>
    </li>
  );
}
