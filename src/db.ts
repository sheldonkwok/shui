import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { IS_TEST } from "./utils.ts";

const DB_URL = process.env.TURSO_DATABASE_URL ?? "file:sqlite.db";

export const dbCredentials = {
  url: DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
};

export function getDB() {
  const client = createClient(dbCredentials);

  const db = drizzle(client, { logger: DB_URL.includes("file") && !IS_TEST });
  return db;
}
