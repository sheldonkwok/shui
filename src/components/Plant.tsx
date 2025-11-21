"use client";

import { useRouter } from "waku";
import type { PlantWithStats } from "../types.ts";
import { waterPlant } from "../actions/plants.ts";

interface PlantProps {
  plant: PlantWithStats;
}

const formatLastWatered = (date: Date | null) => {
  if (!date) return "Never watered";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const threeWeeks = 21;

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= threeWeeks) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / threeWeeks)} weeks ago`;
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
        <div className="watering-stats">
          <span className="watering-count">💧 {plant.wateringCount} times</span>
          <span className="last-watered">
            {formatLastWatered(plant.lastWatered)}
          </span>
        </div>
      </div>
      <button type="button" className="water-button" onClick={handleWater}>
        💧 Water
      </button>
    </li>
  );
}
