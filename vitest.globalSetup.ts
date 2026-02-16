import type { ChildProcess } from "node:child_process";
import { execSync, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execaCommand } from "execa";

const SQLD_PORT = 8080;
const SQLD_URL = `http://127.0.0.1:${SQLD_PORT}`;

let sqldProcess: ChildProcess | undefined;
let tmpDir: string | undefined;

async function waitForSqld(url: string, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // sqld not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`sqld failed to start within ${timeoutMs}ms`);
}

function killStaleSqld() {
  try {
    const pid = execSync(`lsof -t -i :${SQLD_PORT}`, {
      encoding: "utf-8",
    }).trim();
    if (pid) {
      process.kill(Number(pid), "SIGKILL");
    }
  } catch {
    // No process on port, which is fine
  }
}

function killProcess(proc: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!proc.pid || proc.killed) {
      resolve();
      return;
    }

    proc.on("exit", () => resolve());
    proc.kill("SIGTERM");

    setTimeout(() => {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
      resolve();
    }, 3_000);
  });
}

export async function setup() {
  // Kill any stale sqld process from a previous run
  killStaleSqld();

  tmpDir = await mkdtemp(join(tmpdir(), "sqld-test-"));

  sqldProcess = spawn(
    "node_modules/.pnpm/node_modules/.bin/sqld",
    ["--db-path", `${tmpDir}/test.sqld`, "--http-listen-addr", `127.0.0.1:${SQLD_PORT}`],
    { stdio: "ignore" },
  );

  await waitForSqld(SQLD_URL);

  // Run migrations against the turso instance
  await execaCommand("pnpm drizzle-kit push", {
    stdio: "inherit",
    env: { ...process.env, TURSO_DATABASE_URL: SQLD_URL },
  });
}

export async function teardown() {
  if (sqldProcess) {
    await killProcess(sqldProcess);
    sqldProcess = undefined;
  }

  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
}
