# Agent Guidelines

This document provides guidelines for AI agents working on the shui project.

## Technical Notes

The project uses PGlite (in-process PostgreSQL) for its database. No external database process is needed — PGlite runs embedded in Node.js. Data is stored in the `./pglite` directory. Run `pnpm migrate` to push the schema.

Always use **pnpm**, never npm.

Use execa instead of execSync for shelling out.

## Styling

Always use Tailwind CSS with `cva` (class-variance-authority) for component styling. Define styles as `cva(...)` constants at the top of the file and apply them as `styleName()` in JSX.

## External APIs

### GBIF — Plant Species Lookup

Base URL: `https://api.gbif.org/v1`. No authentication required for read-only endpoints.

- **Species match** (exact lookup by name) — returns full taxonomic hierarchy, confidence score, and match type:
  ```
  GET /species/match?name=Dracaena+marginata
  ```
- **Species search** (by query string) — paginated with `limit` and `offset`; `status=ACCEPTED` filters out synonyms:
  ```
  GET /species/search?q=dracaena&rank=SPECIES&status=ACCEPTED
  ```

Response fields of note: `scientificName`, `canonicalName`, `rank`, `status`, `confidence`, `matchType`, `kingdom`, `phylum`, `order`, `family`, `genus`, `speciesKey`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Secret for signing auth session cookies. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `MCP_API_KEY` | No | Bearer token for MCP endpoint auth. If unset, the endpoint is open. Generate with `openssl rand -base64 32`. |
| `DATABASE_URL` | No | External Postgres URL. If unset, PGlite is used. |
| `PGLITE_DIR` | No | Directory for PGlite data files. Defaults to `./pglite`. |
| `VERCEL_ENV` | No | Set by Vercel (`preview`, `production`). Used to gate preview auth. |

## Workflow

1. Never touch the `.envrc` file.
2. Make your code changes.
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `<type>: <description>`, where type is one of `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`. Example: `feat: Add water scheduling feature for plants`.
4. Fetch and rebase main before pushing: `git fetch origin main && git rebase origin/main`.
5. Push your changes.
6. Cloud agents (Claude.ai): after the first push of new code on a branch, open a pull request automatically without waiting to be asked. Later pushes update that same PR.

## Hooks

Claude Code hooks live in `.claude/hooks/` and are registered in `.claude/settings.json`. See `.claude/hooks/README.md` for how to write and test one.

- **SessionStart** — installs dependencies and sets up the e2e database. Runs automatically, including in cloud sessions.
- **Stop** — linting, type checking, migrations, unit tests, e2e tests.

The project's Stop hooks do not run in Claude.ai cloud sessions. Cloud agents must run them manually before finishing (after all changes are committed):

```bash
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/biome-check.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/tsc-if-ts-changed.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/migrate.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/test.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/test-e2e.sh
```

If any script exits non-zero, fix the problem before proceeding.
