import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: "file:sqlite.db",
  },
});
