import { rm } from "node:fs/promises";
import { $ } from "execa";

export async function setup() {
  await rm("./pglite-test", { recursive: true, force: true });
  await $({ env: { PGLITE_DIR: "./pglite-test" }, stdio: "inherit" })`pnpm migrate`;
}

export async function teardown() {
  await rm("./pglite-test", { recursive: true, force: true });
}
