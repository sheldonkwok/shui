"use client";

import styled from "@emotion/styled";
import { Plant } from "./Plant.tsx";
import type { PlantWithStats } from "../types.ts";

const Container = styled.div`
  margin-bottom: 40px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NoPlants = styled.p`
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
`;

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  const parsedTransition = plants.map((plant, index) => {
    const nextPlant = plants[index + 1];
    const isTransition =
      plant.daysUntilNextWatering !== null &&
      plant.daysUntilNextWatering < 0 &&
      nextPlant &&
      nextPlant.daysUntilNextWatering !== null &&
      nextPlant.daysUntilNextWatering >= 0;

    return { plant, isTransition };
  });

  return (
    <Container>
      {plants.length > 0 ? (
        <List>
          {parsedTransition.map(({ plant, isTransition }) => {
            return (
              <Plant key={plant.id} plant={plant} isTransition={isTransition} />
            );
          })}
        </List>
      ) : (
        <NoPlants>No plants yet. Add your first plant below!</NoPlants>
      )}
    </Container>
  );
}
