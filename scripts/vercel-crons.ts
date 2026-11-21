// Adds the app's cron jobs to the Vercel build output. Waku's Vercel adapter writes
// .vercel/output/config.json itself, so crons can't be relied on from vercel.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CRONS } from "../src/api/cron.ts";

const configPath = ".vercel/output/config.json";

if (!existsSync(configPath)) {
  console.log(`No ${configPath}; not a Vercel build, so no crons to add.`);
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
writeFileSync(configPath, JSON.stringify({ ...config, crons: CRONS }, null, 2));
console.log(`Added ${CRONS.length} cron job(s) to ${configPath}.`);
