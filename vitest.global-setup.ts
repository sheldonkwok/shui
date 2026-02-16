import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";

let tursoProcess: ChildProcess;

export async function setup() {
  tursoProcess = spawn("turso", ["dev", "--db-file", "sqlite.test.db", "--port", "8081"], { stdio: "pipe" });

  // Wait for turso dev to be ready by polling the URL
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch("http://127.0.0.1:8081");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("turso dev failed to start within timeout");
}

export async function teardown() {
  if (tursoProcess) {
    tursoProcess.kill();
  }
}
