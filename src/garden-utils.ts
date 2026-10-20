export type ChoreStatus = "due" | "done" | "upcoming";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Short month name for a 1–12 month number. */
export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

/** e.g. "Mar–Apr", or "Mar" for a one-month window. */
export function formatMonthRange(startMonth: number, endMonth: number): string {
  if (startMonth === endMonth) return monthName(startMonth);
  return `${monthName(startMonth)}–${monthName(endMonth)}`;
}

/** Whether `month` (1–12) falls in the start..end window, which may wrap the new year. */
export function inSeason(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) return month >= startMonth && month <= endMonth;
  return month >= startMonth || month <= endMonth;
}

/** First day of the season window `now` is in, or null when `now` is out of season. */
export function seasonStart(startMonth: number, endMonth: number, now: Date = new Date()): Date | null {
  const month = now.getMonth() + 1;
  if (!inSeason(month, startMonth, endMonth)) return null;
  // In a wrapping window (Nov–Feb), January belongs to the season that began last year.
  const year = month >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, startMonth - 1, 1);
}

/** A chore is done once it has a completion inside the current season window. */
export function choreStatus(
  startMonth: number,
  endMonth: number,
  lastCompletedAt: Date | null,
  now: Date = new Date(),
): ChoreStatus {
  const start = seasonStart(startMonth, endMonth, now);
  if (!start) return "upcoming";
  return lastCompletedAt && lastCompletedAt >= start ? "done" : "due";
}

/**
 * Average days between irrigation runs and days until the next one is due (negative
 * when overdue), from runs sorted newest first. Mirrors the per-plant watering summary.
 */
export function irrigationSchedule(runTimes: Date[], now: Date = new Date()) {
  const lastRun = runTimes[0] ?? null;
  if (runTimes.length < 2) return { lastRun, avgIntervalDays: null, daysUntilNextRun: null };
  const oldest = runTimes[runTimes.length - 1]!;
  const avgIntervalDays =
    Math.round(((lastRun!.getTime() - oldest.getTime()) / (runTimes.length - 1) / DAY_MS) * 10) / 10;
  const daysUntilNextRun =
    Math.round((avgIntervalDays - (now.getTime() - lastRun!.getTime()) / DAY_MS) * 10) / 10;
  return { lastRun, avgIntervalDays, daysUntilNextRun };
}
