#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
pnpm exec drizzle-kit push && node --experimental-strip-types scripts/sync-views.ts
