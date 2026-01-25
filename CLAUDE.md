# Agent Guidelines

This document provides guidelines for AI agents working on the shui project.

## Technical Notes
When inserting into sqlite with drizzle, we need to make sure we're using the correct primitive type. For example, booleans are actually integers and should be 1 for true and 0 for false.


## Pre-Commit Requirements

### 1. Always Run Tests Before Committing

Before creating any commit, you **must** run the test suite to ensure all tests pass:

```bash
pnpm test
```

- Verify that all existing tests pass
- If you added new functionality, ensure appropriate tests are included
- Fix any failing tests before proceeding with the commit
- Do not commit code with failing tests

### 2. Always Use pnpm Instead of npm

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

### 3. Use Conventional Commit Style

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

1. Make your code changes
2. Run `pnpm test` and ensure all tests pass
3. Stage your changes with `git add`
4. Commit with conventional commit style
5. Push your changes

Following these guidelines ensures code quality and maintains a clean, understandable commit history.
