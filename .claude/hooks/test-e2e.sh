#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# Remote containers ship a preinstalled Chromium that may not match the
# revision Playwright expects; use it directly when present.
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && [ -e /opt/pw-browsers/chromium ]; then
  export CHROMIUM_PATH=/opt/pw-browsers/chromium
fi

CI=1 pnpm exec playwright test
