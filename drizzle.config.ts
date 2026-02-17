import { defineConfig } from "drizzle-kit";

const PGLITE_DIR = process.env.PGLITE_DIR ?? "./pglite";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: { url: PGLITE_DIR },
});
