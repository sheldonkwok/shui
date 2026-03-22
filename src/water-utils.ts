const MAX_DAYS_SCALE = 4;

export function getWaterRatio(daysUntilNextWatering: number | null): number {
  if (daysUntilNextWatering === null) return 0;
  if (daysUntilNextWatering <= 0) return 1;
  if (daysUntilNextWatering >= MAX_DAYS_SCALE) return 0;
  return 1 - daysUntilNextWatering / MAX_DAYS_SCALE;
}
