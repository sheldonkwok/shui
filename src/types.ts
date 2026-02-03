export interface PlantWithStats {
  id: number;
  name: string;
  wateringCount: number;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  daysUntilNextWatering: number | null;
}
