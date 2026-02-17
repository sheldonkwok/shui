import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { IS_TEST } from "./utils.ts";

function createDB() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const client = postgres(databaseUrl);
    return drizzlePg(client, { logger: !IS_TEST });
  }
  const pgliteDir = process.env.PGLITE_DIR ?? "./pglite";
  const client = new PGlite(pgliteDir);
  return drizzlePglite(client, { logger: !IS_TEST });
}

let db: ReturnType<typeof createDB> | null = null;

export function getDB() {
  if (!db) {
    db = createDB();
  }

  return db;
}
