import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      PGLITE_DIR: "./pglite-test",
    },
    globalSetup: "./vitest.global-setup.ts",
    fileParallelism: false,
  },
});
