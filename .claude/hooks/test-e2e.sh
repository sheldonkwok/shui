#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
CI=1 pnpm exec playwright test
