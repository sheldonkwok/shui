# Plan: Revert suggestSpecies to client-side

## Context

The previous refactor moved GBIF API usage to server actions. However, `suggestSpecies` (the GBIF suggest call used for autocomplete) is a read-only call to a public API with no auth requirement. Routing it through the server adds unnecessary round-trip latency on every keystroke. It should live in the component as a local function calling GBIF directly from the browser, saving one server hop per suggestion fetch.

`classifyPlant` stays in `src/actions/plants.ts` — it writes to the DB and correctly belongs server-side.

## Changes

### 1. `src/actions/plants.ts`

Remove `suggestSpecies` export and its `GbifSuggestion` interface (no longer needed here since `classifyPlant` doesn't use it).

### 2. `src/components/PlantActionsDialog/EditableSpecies.tsx`

- Remove the `suggestSpecies` import
- Restore the inline `fetchSuggestions` function that calls GBIF directly:
  ```typescript
  const res = await fetch(
    `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&limit=10`,
  );
  const data: GbifSuggestion[] = await res.json();
  return data.filter((s) => s.canonicalName);
  ```
- Keep the local `GbifSuggestion` interface in the component file

## Critical Files

| File | Change |
|------|--------|
| `src/actions/plants.ts` | Remove `suggestSpecies` and `GbifSuggestion` |
| `src/components/PlantActionsDialog/EditableSpecies.tsx` | Remove import, restore inline fetch |

## Verification

Run `pnpm check && pnpm test` — all 37 tests should pass.
