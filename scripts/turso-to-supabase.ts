import { $ } from "execa";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

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

const sql = postgres(DATABASE_URL);

const { stdout: plantsOutput } = await $`turso db shell shui ${"SELECT * FROM plants"}`;
const { stdout: wateringsOutput } = await $`turso db shell shui ${"SELECT * FROM waterings"}`;

const plants = parseTursoTable(plantsOutput).map((r) => ({
  id: Number(r.id),
  name: r.name,
}));

const waterings = parseTursoTable(wateringsOutput).map((r) => ({
  id: Number(r.id),
  plant_id: Number(r.plant_id),
  watering_time: new Date(Number(r.watering_time) * 1000),
  fertilized: Boolean(Number(r.fertilized)),
}));

console.log(`Found ${plants.length} plants, ${waterings.length} waterings`);

await sql`INSERT INTO plants ${sql(plants, "id", "name")}`;
console.log(`Inserted ${plants.length} plants`);

await sql`INSERT INTO waterings ${sql(waterings, "id", "plant_id", "watering_time", "fertilized")}`;
console.log(`Inserted ${waterings.length} waterings`);

await sql`SELECT setval('plants_id_seq', (SELECT MAX(id) FROM plants))`;
await sql`SELECT setval('waterings_id_seq', (SELECT MAX(id) FROM waterings))`;
console.log("Reset sequences");

await sql.end();
console.log("Done");
