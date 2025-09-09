const DB_URL = process.env["TURSO_DATABASE_URL"] ?? "file:sqlite.db";

export const dbCredentials = {
  url: DB_URL,
  authToken: process.env["TURSO_AUTH_TOKEN"]!,
};
