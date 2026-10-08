#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

pnpm install

# The preinstalled Chromium is used directly (see test-e2e.sh); only download
# one when it is missing.
if [ ! -e /opt/pw-browsers/chromium ]; then
  pnpm exec playwright install --with-deps chromium
fi
