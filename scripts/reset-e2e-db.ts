import { rm } from "node:fs/promises";
import { $ } from "execa";

const PGLITE_DIR = "./pglite-e2e";

await rm(PGLITE_DIR, { recursive: true, force: true });
await $({ env: { PGLITE_DIR }, stdio: "inherit" })`pnpm migrate`;
