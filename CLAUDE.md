# Agent Guidelines

This document provides guidelines for AI agents working on the shui project.

## Repository Structure

```
src/
├── actions/        # Server-only business logic ("use server"). Calls DB helpers and external APIs.
├── api/            # REST API routes (Hono). Thin HTTP layer over the same business logic.
├── components/     # React components (UI layer). Mix of server and client components.
│   ├── ui/         # Reusable low-level primitives (Dialog, Input, Toggle, …).
│   └── PlantActionsDialog/  # Sub-components for the plant action dialog.
├── pages/          # Waku page/layout entry points.
├── hooks/          # Custom React hooks (e.g. useSession).
├── styles/         # Tailwind config, palette, global CSS.
├── db.ts           # Database initialisation (PGlite or external Postgres).
├── schema.ts       # Drizzle ORM table definitions.
├── types.ts        # Shared TypeScript types.
└── api/client.ts   # Type-safe Hono client used by UI components.
```

**`actions/` vs `components/`** — `actions/` contains server-side functions that query the database or call external APIs; they are never bundled into the client. `components/` contains the React rendering layer; server components call actions directly, while client components hit the REST API via `api/client.ts`.

### Plant List

The plant list is split across three files:

- `components/PlantList.tsx` — async server component that calls `getPlants()` and passes the result down.
- `components/PlantListClient.tsx` — client component that renders the list and owns local UI state (e.g. optimistic updates).
- `components/Plant.tsx` — individual list item; shows the plant name, a last-watered timestamp, and a colour gradient indicating watering urgency. Clicking a row opens the Plant Action Dialog.

### Plant Action Dialog

`components/PlantActionsDialog/` is a modal dialog that opens when the user clicks a plant. It is composed of:

- `index.tsx` — outer dialog shell and layout.
- `EditableName.tsx` — click-to-edit plant name; saves via `PATCH /api/plants/:id`.
- `EditableSpecies.tsx` — click-to-edit species with live GBIF autocomplete; saves via `POST /api/plants/:id/classify`.
- `ButtonContainer.tsx` — Water button (logs a watering event), Fertilize toggle, and Delay control for snoozing the next watering reminder.

## Technical Notes

The project uses PGlite (in-process PostgreSQL) for its database. No external database process is needed — PGlite runs embedded in Node.js. Data is stored in the `./pglite` directory. Run `pnpm migrate` to push the schema.

Use execa instead of execSync for shelling out. 

## Styling

Always use Tailwind CSS with `cva` (class-variance-authority) for component styling. Define styles as `cva(...)` constants at the top of the file and apply them as `styleName()` in JSX.

## External APIs 
GBIF API — Plant Species Lookup

Base URL: https://api.gbif.org/v1
No authentication required for read-only endpoints.
Species match (exact lookup by name):

GET /species/match?name=Dracaena+marginata
Returns full taxonomic hierarchy, confidence score, and match type.
Species search (search by query string):

GET /species/search?q=dracaena&rank=SPECIES&status=ACCEPTED
Returns paginated list of matching species. Use limit and offset for pagination. status=ACCEPTED filters out synonyms.
Response fields of note: scientificName, canonicalName, rank, status, confidence, matchType, kingdom, phylum, order, family, genus, speciesKey.

## Pre-Commit Requirements

### 1. Always Use pnpm Instead of npm

This project uses **pnpm** as the package manager. Always use pnpm commands instead of npm:

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Add a package
pnpm add <package-name>

# Remove a package
pnpm remove <package-name>
```

**Never use npm commands** - always use pnpm to maintain consistency and proper dependency management.

### 2. Use Conventional Commit Style

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

#### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

#### Common Types

- **feat:** A new feature
- **fix:** A bug fix
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **style:** Changes that do not affect the meaning of the code (formatting, missing semi-colons, etc.)
- **test:** Adding missing tests or correcting existing tests
- **docs:** Documentation only changes
- **chore:** Changes to the build process or auxiliary tools

#### Examples

```bash
# Good commit messages
git commit -m "feat: Add water scheduling feature for plants"
git commit -m "fix: Resolve plant list rendering issue"
git commit -m "refactor: Simplify plant action handlers"
git commit -m "test: Add tests for plant deletion"
git commit -m "style: Fix padding on plant rows"

# Bad commit messages (avoid these)
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP"
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MCP_API_KEY` | No | Bearer token for MCP endpoint auth. If unset, the endpoint is open. |
| `DATABASE_URL` | No | External Postgres URL. If unset, PGlite is used. |
| `PGLITE_DIR` | No | Directory for PGlite data files. Defaults to `./pglite`. |
| `VERCEL_ENV` | No | Set by Vercel (`preview`, `production`). Used to gate preview auth. |

### Generating MCP_API_KEY

```bash
openssl rand -base64 32
```

## Workflow Summary

1. Never touch the .envrc file
1. Make your code changes
1. Stage your changes with `git add`
1. Commit with conventional commit style
1. Push your changes

Following these guidelines ensures code quality and maintains a clean, understandable commit history.


## Hooks

Claude Code hooks live in `.claude/hooks/` and are registered in `.claude/settings.json`. There are two hook events in use:

- **SessionStart** — runs when a remote session begins (installs dependencies, Playwright browsers)
- **Stop** — runs after every session (linting, type checking, migrations, unit tests, e2e tests)

### Creating a Hook

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

### Evaluating a Hook

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

## Plan Management

When creating or updating a plan:
- Plans live in `plan.md` at the repo root
- Never overwrite `plan.md` entirely
- If `plan.md` already exists, append a new section at the bottom:
  `## Revision N — YYYY-MM-DD` (increment N from the last revision)
- Each revision must include:
  - What changed from the prior revision and why
  - The full updated plan (not just a diff)
- Do not delete or modify any prior revision sections
