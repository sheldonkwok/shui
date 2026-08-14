# Remove the list/grid view toggler

## Context

`PlantListClient` currently renders a right-aligned toolbar with two `Toggle` buttons that switch
between the thirst-sorted list view and a square-card grid view (added in `3b5e45c`). Since the
thirst-first list redesign in `1e7a433`, the list is the real product surface — it carries the
sorting, thirst bands, gradient urgency and the paper panel — while the grid view renders the
plants **unsorted** with a placeholder tree icon and no watering context. The toggler is dead
weight and a second, worse rendering of the same data to maintain.

Outcome: the plant list always renders the list view. The toggler, the grid branch, and the
grid-only card component are gone.

Note: the codebase calls this feature "grid", not "tile" — there is no `PlantTile` and the string
"tile" does not appear anywhere in the repo. The grid view is the thing being removed.

## Changes

### 1. `src/components/PlantListClient.tsx` — the only stateful file

- Delete `useState` and the `viewMode` state (L51). `useState` is no longer imported; `useMemo`
  stays for `sortedPlants`.
- Delete the imports that become unused: `LayoutGrid` / `List` from `lucide-react` (L4),
  `PlantCard` (L9), `ButtonGroup` (L10), `Toggle` (L11).
- Delete the `toolbar` (L14) and `grid` (L21) cva constants.
- Delete the whole toolbar `<div>` (L58–79) and collapse the `viewMode === "list" ? … : …`
  ternary (L80–97) down to just the list branch. With the toolbar gone the surrounding `<>…</>`
  fragment is no longer needed — the `plants.length > 0` branch becomes the `panelWrap` div
  directly.
- Reword the `thirstBand` doc comment (L24): drop "Mirrors getWaterRatio's thresholds", which
  will dangle once that function is deleted.

Keep `sortByThirst`, `thirstBand`, `container`, `panelWrap`, `logoMark`, `panelCard`, `list`,
`noPlants` and the empty-state paragraph exactly as they are.

### 2. `src/components/PlantCard.tsx` — delete the file

Its only importer is `PlantListClient.tsx:9`. It exists solely to be a grid tile.

### 3. `src/water-utils.ts` — drop `getWaterRatio` and `MAX_DAYS_SCALE`

`PlantCard` is the last caller (`water-utils.ts:3-8`). `Plant.tsx:8` imports only
`getExpectedDayRatio`, which stays. Removing the dead export leaves the file with
`getExpectedDayRatio` alone; also strip the "Unlike getWaterRatio's fixed near-term window"
clause from its doc comment so it doesn't reference a deleted function.

### Deliberately not touched

- `src/components/ui/Toggle.tsx`, `src/components/ui/ButtonGroup.tsx` and the
  `@radix-ui/react-toggle` dependency — still used by the fertilize toggle in
  `src/components/PlantActionsDialog/ButtonContainer.tsx:104-156`.
- `lucide-react`'s `TreeDeciduous` — also used by
  `src/components/PlantActionsDialog/PlantImagePlaceholder.tsx`.
- `src/styles/palette.ts` — `colors.borderList` and `colors.waterBlueRgb` are read by
  `Plant.tsx` and `cls.bgBorderList` too.
- `src/components/PlantList.tsx`, `Plant.tsx`, `pages/` — none are view-mode aware.
- `.claude/plans/mossy-prancing-wolf.md` — historical design doc for the original feature; left
  as a record.
- `CLAUDE.md` — never documented the grid view, so no doc update is needed.

## Verification

No existing test references the toggle, grid mode, or `PlantCard`, so nothing needs deleting on
the test side. `e2e/plants.spec.ts` uses `page.getByRole("listitem")` (L52, L89), which already
resolves against the default list view and should keep passing unchanged — that is the main
regression signal.

Run the hook scripts manually (cloud agents don't fire hooks automatically) after committing:

```bash
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/biome-check.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/tsc-if-ts-changed.sh   # catches any stale import
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/migrate.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/test.sh
CLAUDE_PROJECT_DIR=$(pwd) ./.claude/hooks/test-e2e.sh
```

`tsc` and biome together are the real check here: a removal this shaped fails loudly on any
missed import or now-unused binding.

Commit on `claude/remove-list-tile-toggler-ho399w` as
`refactor: remove list/grid view toggler and grid view`, then push with
`git push -u origin claude/remove-list-tile-toggler-ho399w`.
