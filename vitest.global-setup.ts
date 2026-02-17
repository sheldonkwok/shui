import { rm } from "node:fs/promises";

export async function setup() {
  // Clean up any previous test database so each run starts fresh
  await rm("./pglite-test", { recursive: true, force: true });
}

export async function teardown() {
  await rm("./pglite-test", { recursive: true, force: true });
}
