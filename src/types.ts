export interface PlantWithStats {
  id: number;
  name: string;
  wateringCount: number;
  lastWatered: Date | null;
  daysUntilNextWatering: number | null;
}
