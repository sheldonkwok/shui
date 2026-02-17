# Agent Guidelines

This document provides guidelines for AI agents working on the shui project.

## Technical Notes

The project uses PGlite (in-process PostgreSQL) for its database. No external database process is needed — PGlite runs embedded in Node.js. Data is stored in the `./pglite` directory. Run `pnpm migrate` to push the schema.

Use execa instead of execSync for shelling out. 

## Styling

Always use Tailwind CSS with `cva` (class-variance-authority) for component styling. Define styles as `cva(...)` constants at the top of the file and apply them as `styleName()` in JSX.

## Code Quality Checks

**CRITICAL: After generating or modifying any code, you MUST run the following checks:**

```bash
pnpm install  # Run this first to ensure dependencies are installed
pnpm check  # Check and fix code formatting/linting
pnpm test    # Run all tests to ensure nothing broke
```

### When to Run

- Immediately after creating or editing any source code files
- After adding or modifying functionality
- Before considering a task complete

### What to Do If Checks Fail

**If `pnpm check` fails:**

- Review the linting errors reported
- Fix the issues (check will auto-fix most formatting issues)
- Re-run `pnpm check` to verify fixes

**If `pnpm test` fails:**

- Read the test failure output carefully
- Fix the broken functionality or update tests if behavior intentionally changed
- Do NOT proceed until all tests pass

**Important:** Code is not considered complete until both `pnpm check` and `pnpm test` pass successfully.

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

## Workflow Summary

1. Never touch the .envrc file
1. Make your code changes
1. Run `pnpm install` to ensure dependencies are installed
1. Run `pnpm test` and ensure all tests pass
1. Stage your changes with `git add`
1. Commit with conventional commit style
1. Push your changes

Following these guidelines ensures code quality and maintains a clean, understandable commit history.
