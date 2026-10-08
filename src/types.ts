export interface PlantWithStats {
  id: number;
  name: string;
  species: string | null;
  wateringCount: number;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  lastRepotted: Date | null;
  avgWateringIntervalDays: number | null;
  daysUntilNextWatering: number | null;
  /** Whole days left on an active watering delay, or null when there is none. */
  delayDaysRemaining: number | null;
}

/** A single watering event, as returned by `GET /api/plants/:id/waterings`. */
export interface WateringEntry {
  id: number;
  /** ISO-8601 timestamp. */
  wateringTime: string;
  fertilized: boolean;
  repot: boolean;
}
