export interface PlantWithStats {
  id: number;
  name: string;
  species: string | null;
  wateringCount: number;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  avgWateringIntervalDays: number | null;
  daysUntilNextWatering: number | null;
}
