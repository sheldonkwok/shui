import { type SQL, sql, ViewBaseConfig } from "drizzle-orm";
import { PgMaterializedView } from "drizzle-orm/pg-core";
import { getDB } from "../src/db.ts";
import * as schema from "../src/schema.ts";

const db = getDB();
const databaseUrl = process.env.DATABASE_URL;
const pgliteDir = process.env.PGLITE_DIR ?? "./pglite";

function getSyncTargetHost() {
  if (!databaseUrl) {
    return `local pglite (${pgliteDir})`;
  }

  try {
    const url = new URL(databaseUrl);
    const port = url.port ? `:${url.port}` : "";
    return `${url.hostname}${port}`;
  } catch {
    return "unknown (invalid DATABASE_URL)";
  }
}

console.log(`Sync target database host: ${getSyncTargetHost()}`);

const views = Object.values(schema).filter((value) => value instanceof PgMaterializedView);

for (const view of views) {
  // biome-ignore lint/suspicious/noExplicitAny: accessing internal drizzle config
  const config = (view as any)[ViewBaseConfig];
  const { name, query } = config as { name: string; query: SQL | undefined };
  if (!query) {
    console.warn(`Skipping ${name}: no query defined`);
    continue;
  }
  console.log(`Syncing materialized view: ${name}`);
  await db.execute(sql`DROP MATERIALIZED VIEW IF EXISTS ${sql.identifier(name)}`);
  await db.execute(sql`CREATE MATERIALIZED VIEW ${sql.identifier(name)} AS ${query}`);
}

console.log(`Done. Synced ${views.length} materialized view(s).`);
process.exit(0);
