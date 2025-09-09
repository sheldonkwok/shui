import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      TURSO_DATABASE_URL: "file:sqlite.test.db",
    },
  },
});
