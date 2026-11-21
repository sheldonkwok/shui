import { type DBExecutor, getDB } from "./db.ts";
import { irrigationRuns } from "./schema.ts";

/** The garden is in ZIP 94123 (San Francisco's Marina); weather is looked up at its centre. */
export const GARDEN_ZIP = "94123";
const GARDEN_LATITUDE = 37.8003;
const GARDEN_LONGITUDE = -122.4366;
const GARDEN_TIMEZONE = "America/Los_Angeles";

/** A day with more rain than this waters the garden, so it counts as an irrigation run. */
export const RAIN_WATERING_INCHES = 1;

/**
 * Days back the check looks, so a day is still logged if a scheduled check is skipped
 * or late. Days already logged are skipped by the unique `rain_date`.
 */
const LOOKBACK_DAYS = 3;

const OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

export interface RainDay {
  /** YYYY-MM-DD, local to the garden. */
  date: string;
  inches: number;
  /** End of that day in the garden's timezone, used as the irrigation run time. */
  endOfDay: Date;
}

interface OpenMeteoDaily {
  utc_offset_seconds: number;
  daily: { time: string[]; precipitation_sum: (number | null)[] };
}

/** Today's date (YYYY-MM-DD) in the garden's timezone. */
function gardenToday(now: Date): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: GARDEN_TIMEZONE }).format(now);
}

/** Rain totals for the last few full days in the garden, oldest first. Today is left out since it isn't over. */
export async function fetchRecentRain(now: Date = new Date()): Promise<RainDay[]> {
  const params = new URLSearchParams({
    latitude: String(GARDEN_LATITUDE),
    longitude: String(GARDEN_LONGITUDE),
    daily: "precipitation_sum",
    precipitation_unit: "inch",
    timezone: GARDEN_TIMEZONE,
    past_days: String(LOOKBACK_DAYS),
    forecast_days: "1",
  });
  const res = await fetch(`${OPEN_METEO_API}?${params}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Open-Meteo request failed (${res.status})`);
  const body = (await res.json()) as OpenMeteoDaily;

  const today = gardenToday(now);
  const offsetMs = body.utc_offset_seconds * 1000;
  return body.daily.time.flatMap((date, i) => {
    const inches = body.daily.precipitation_sum[i];
    if (date >= today || inches == null) return [];
    const [year, month, day] = date.split("-").map(Number) as [number, number, number];
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMs);
    return [{ date, inches, endOfDay }];
  });
}

/**
 * Logs an irrigation run for each recent day with more than an inch of rain, once per
 * day however often it runs. Returns the days newly logged.
 */
export async function recordRainWaterings(
  now: Date = new Date(),
  db: DBExecutor = getDB(),
): Promise<RainDay[]> {
  const days = await fetchRecentRain(now);
  const recorded: RainDay[] = [];
  for (const day of days) {
    if (day.inches <= RAIN_WATERING_INCHES) continue;
    const inserted = await db
      .insert(irrigationRuns)
      .values({ runTime: day.endOfDay, rainDate: day.date })
      .onConflictDoNothing({ target: irrigationRuns.rainDate })
      .returning();
    if (inserted.length > 0) recorded.push(day);
  }
  return recorded;
}
