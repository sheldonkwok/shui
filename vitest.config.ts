import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      TURSO_DATABASE_URL: "http://127.0.0.1:8081",
    },
    globalSetup: "./vitest.global-setup.ts",
    fileParallelism: false,
  },
});
