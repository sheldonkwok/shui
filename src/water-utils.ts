/**
 * How far the plant is through its own watering interval, 0 (just watered) to 1 (at or
 * past the expected watering day). Scales across the plant's full interval so a
 * long-interval plant still visibly fills in.
 */
export function getExpectedDayRatio(
  daysUntilNextWatering: number | null,
  avgWateringIntervalDays: number | null,
): number {
  if (daysUntilNextWatering === null || avgWateringIntervalDays === null || avgWateringIntervalDays <= 0) {
    return 0;
  }
  const elapsedRatio = (avgWateringIntervalDays - daysUntilNextWatering) / avgWateringIntervalDays;
  return Math.min(Math.max(elapsedRatio, 0), 1);
}
