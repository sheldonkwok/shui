import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const DB_URL = process.env["TURSO_DATABASE_URL"] ?? "file:sqlite.db";

export const dbCredentials = {
  url: DB_URL,
  authToken: process.env["TURSO_AUTH_TOKEN"]!,
};

export function getDB() {
  const client = createClient(dbCredentials);

  const db = drizzle(client, { logger: true });
  return db;
}
