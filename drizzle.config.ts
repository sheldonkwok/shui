import { defineConfig } from "drizzle-kit";
import { dbCredentials } from './src/utils.ts';

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "turso",
  dbCredentials,
});
