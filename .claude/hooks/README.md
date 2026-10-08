# Hooks

## Creating a Hook

Each hook is a standalone bash script. Follow this pattern:

```bash
#!/bin/bash
set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"
pnpm exec <binary> [args]   # use pnpm exec for local package binaries
                             # node and git are system binaries — no pnpm exec needed
```

Register it in `.claude/settings.json` under the appropriate event:

```json
{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/your-hook.sh" }
```

## Evaluating a Hook

Verify each hook errors correctly by making a targeted breaking change, running the script directly, checking the exit code, then reverting:

```bash
# introduce a breaking change
echo 'const _x: number = "oops"' >> src/utils.ts

# run the hook directly
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/tsc-if-ts-changed.sh 2>&1
echo "Exit: ${PIPESTATUS[0]}"   # must be non-zero

# revert
git checkout src/utils.ts
```
