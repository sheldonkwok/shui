import type { ChoreStatus } from "./garden-utils.ts";

export type PlantLocation = "indoor" | "outdoor";

export interface PlantWithStats {
  id: number;
  name: string;
  species: string | null;
  location: PlantLocation;
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

/** Garden-wide irrigation state; every outdoor plant is watered by the same runs. */
export interface IrrigationSummary {
  lastRun: Date | null;
  avgIntervalDays: number | null;
  /** Negative when overdue, null until there are two runs. */
  daysUntilNextRun: number | null;
}

export interface ChoreWithStatus {
  id: number;
  title: string;
  startMonth: number;
  endMonth: number;
  plantId: number | null;
  /** Name of the plant the chore is for, or null for a whole-garden chore. */
  plantName: string | null;
  lastCompletedAt: Date | null;
  status: ChoreStatus;
}
