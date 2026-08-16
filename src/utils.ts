export const IS_TEST = Boolean(process?.env.VITEST);
export const IS_DEV = process.env.NODE_ENV !== "production";
export const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

const WEEK = 7;

/** Calendar-day difference between now and `date`, ignoring time of day. */
export function calendarDaysAgo(date: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCalendarDaysAgo(date: Date): string {
  const diffDays = calendarDaysAgo(date);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= WEEK * 3) return `${diffDays} days ago`;

  return `${Math.floor(diffDays / WEEK)} weeks ago`;
}
