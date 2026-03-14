#!/bin/sh
if git diff --name-only HEAD | grep -qE '\.(ts|tsx|js|jsx|json)$'; then
  output=$(pnpm exec tsc --noEmit 2>&1)
  code=$?
  echo "$output" >&2
  exit $code
fi
