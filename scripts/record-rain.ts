// Logs a garden irrigation run for each recent day with more than an inch of rain.
// Run daily by .github/workflows/record-rain.yml against the production database.
import { GARDEN_ZIP, RAIN_WATERING_INCHES, recordRainWaterings } from "../src/rain.ts";

const recorded = await recordRainWaterings();

if (recorded.length === 0) {
  console.log(`No new days over ${RAIN_WATERING_INCHES}" of rain in ${GARDEN_ZIP}.`);
}
for (const day of recorded) {
  console.log(`Logged a garden watering for ${day.date}: ${day.inches}" of rain in ${GARDEN_ZIP}.`);
}

process.exit(0);
