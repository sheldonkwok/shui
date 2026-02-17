import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { IS_TEST } from "./utils.ts";

const PGLITE_DIR = process.env.PGLITE_DIR ?? "./pglite";

const client = new PGlite(PGLITE_DIR);
const db = drizzle(client, { logger: !IS_TEST });

export function getDB() {
  return db;
}
