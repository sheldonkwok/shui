"use client";

import styled from "@emotion/styled";
import { useRouter } from "waku";
import type { PlantWithStats } from "../types.ts";
import { waterPlant } from "../actions/plants.ts";

interface PlantProps {
  plant: PlantWithStats;
  isTransition?: boolean;
}

const PlantItem = styled.li<{ isTransition: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr max-content;
  gap: 12px;
  align-items: center;
  padding: 3.75px 0;
  margin-bottom: 0.625em;
  border-bottom: 1px solid ${(props) => (props.isTransition ? "#6d94c5" : "#e9ecef")};
`;

const PlantName = styled.span`
  font-weight: 500;
  color: #2d5f3f;
  font-size: 1em;
`;

const NextWater = styled.span`
  color: #999;
  font-size: 0.8em;
  white-space: nowrap;
`;

const LastWatered = styled.span`
  color: #999;
  font-size: 0.8em;
  white-space: nowrap;
`;

const WaterButton = styled.button`
  background-color: #6d94c5;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: #357abd;
  }

  &:active {
    transform: translateY(1px);
  }
`;

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
  const router = useRouter();

  const handleWater = async () => {
    await waterPlant(plant.id);
    router.reload();
  };

  return (
    <PlantItem isTransition={isTransition}>
      <PlantName>{plant.name}</PlantName>
      <NextWater>{formatDaysUntilNext(plant.daysUntilNextWatering)}</NextWater>
      <LastWatered>{formatLastWatered(plant.lastWatered)}</LastWatered>
      <WaterButton type="button" onClick={handleWater}>
        Water
      </WaterButton>
    </PlantItem>
  );
}
