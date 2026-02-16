import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    globalSetup: "./vitest.globalSetup.ts",
    env: {
      TURSO_DATABASE_URL: "http://127.0.0.1:8080",
    },
    fileParallelism: false,
  },
});
