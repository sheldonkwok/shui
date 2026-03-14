#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
pnpm exec vitest run
