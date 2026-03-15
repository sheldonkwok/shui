import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const pgliteE2eDir = path.resolve(projectRoot, "pglite-e2e");

export default async function globalSetup() {
  rmSync(pgliteE2eDir, { recursive: true, force: true });
  await execa("pnpm", ["migrate"], {
    cwd: projectRoot,
    env: { ...process.env, PGLITE_DIR: pgliteE2eDir },
    stdio: "inherit",
  });
}
