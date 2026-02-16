import { sql } from "drizzle-orm";
import { $ } from "execa";
import { getDB } from "../src/db.ts";
import { plants, waterings } from "../src/schema.ts";

function parseTursoTable(output: string): Record<string, string>[] {
  const lines = output.trim().split("\n");
  if (lines.length < 2) return [];

  // Header has column names separated by whitespace
  // But column names can be multi-word (e.g. "PLANT ID", "WATERING TIME")
  // We need to figure out column boundaries from the header spacing
  const headerLine = lines[0];
  if (!headerLine) return [];
  const dataLines = lines.slice(1);

  // Find column start positions by looking at where groups of non-space chars start
  // after a gap of 2+ spaces (or start of line)
  const colStarts: number[] = [];
  let inGap = true;
  for (let i = 0; i < headerLine.length; i++) {
    if (headerLine[i] !== " ") {
      if (inGap) {
        colStarts.push(i);
        inGap = false;
      }
    } else {
      // Check if this is a multi-space gap (column separator) vs single space (within column name)
      if (i + 1 < headerLine.length && headerLine[i + 1] === " ") {
        inGap = true;
      }
    }
  }

  const headers = colStarts.map((start, i) => {
    const end = i + 1 < colStarts.length ? colStarts[i + 1] : headerLine.length;
    return headerLine.slice(start, end).trim().toLowerCase().replace(/ /g, "_");
  });

  return dataLines.map((line) => {
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const start = colStarts[i]!;
      const end = i + 1 < colStarts.length ? colStarts[i + 1] : line.length;
      row[headers[i]!] = line.slice(start, end).trim();
    }
    return row;
  });
}

const db = getDB();

const { stdout: plantsOutput } = await $`turso db shell shui ${"SELECT * FROM plants"}`;
const { stdout: wateringsOutput } = await $`turso db shell shui ${"SELECT * FROM waterings"}`;

const plantsData = parseTursoTable(plantsOutput).map((r) => ({
  id: Number(r.id),
  name: r.name!,
}));

const wateringsData = parseTursoTable(wateringsOutput).map((r) => ({
  id: Number(r.id),
  plantId: Number(r.plant_id),
  wateringTime: new Date(Number(r.watering_time) * 1000),
  fertilized: Boolean(Number(r.fertilized)),
}));

console.log(`Found ${plantsData.length} plants, ${wateringsData.length} waterings`);

await db.insert(plants).values(plantsData);
console.log(`Inserted ${plantsData.length} plants`);

await db.insert(waterings).values(wateringsData);
console.log(`Inserted ${wateringsData.length} waterings`);

await db.execute(sql`SELECT setval('plants_id_seq', (SELECT MAX(id) FROM plants))`);
await db.execute(sql`SELECT setval('waterings_id_seq', (SELECT MAX(id) FROM waterings))`);
console.log("Reset sequences");

console.log("Done");
process.exit(0);
