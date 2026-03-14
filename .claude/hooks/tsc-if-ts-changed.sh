#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
if git diff --name-only HEAD | grep -qE '\.(ts|tsx|js|jsx|json)$'; then
  pnpm exec tsc --noEmit
fi
