"use client";

import { useRouter } from "waku";
import type { PlantWithStats } from "../types.ts";
import { waterPlant } from "../actions/plants.ts";

interface PlantProps {
  plant: PlantWithStats;
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

const formatDaysUntilNext = (days: number | null) => {
  if (days === null) return "—";

  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return "Due today";
  } else if (days < 1) {
    return "< 1 day";
  } else if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
};

export function Plant({ plant }: PlantProps) {
  const router = useRouter();

  const handleWater = async () => {
    await waterPlant(plant.id);
    router.reload();
  };

  return (
    <li className="plant-item">
      <div className="plant-info">
        <span className="plant-name">{plant.name}</span>
        <span className="last-watered">
          {formatLastWatered(plant.lastWatered)}
        </span>
        <span className="avg-interval">
          {formatDaysUntilNext(plant.daysUntilNextWatering)}
        </span>
      </div>
      <button type="button" className="water-button" onClick={handleWater}>
        💧 Water
      </button>
    </li>
  );
}
