# Plan: Create Plant Grid View

## Context

The plant list currently only has a single list view (`PlantListClient.tsx` → `Plant.tsx`). The user wants a grid view where each plant is shown as a card with a placeholder image, the plant name centered on the image, and the full card border using the same blue water gradient currently applied as a bottom border in the list view.

## Changes

### 1. Extract shared `getWaterRatio` into `src/lib/waterRatio.ts`

Move `getWaterRatio()` and `MAX_DAYS_SCALE` from `Plant.tsx` into a new shared module so both `Plant.tsx` and the new `PlantCard.tsx` can import it.

### 2. Update `src/components/Plant.tsx`

- Remove local `getWaterRatio` and `MAX_DAYS_SCALE`
- Import from `../lib/waterRatio.ts`

### 3. Create `src/components/PlantCard.tsx`

New client component for grid cards:

- **Gradient border trick**: outer wrapper div with `p-[2px] rounded-lg` and inline `background: linear-gradient(135deg, borderList, rgba(waterBlueRgb, ratio))`. Inner div with `rounded-[calc(0.5rem-2px)] bg-[#fffdf6]` (page background) so gradient shows as a 2px border.
- **Content**: `TreeDeciduous` icon (from lucide-react) filling the card as a light placeholder, plant name absolutely positioned and centered over it (`text-center font-medium` in primary green).
- **Interaction**: clicking the card opens `PlantActionsDialog` (same pattern as `Plant.tsx`).
- **Sizing**: `aspect-square` cards, plant name uses `line-clamp-2 truncate` for overflow.

### 4. Update `src/components/PlantListClient.tsx`

- Add `useState<"list" | "grid">("list")` for view mode
- Add a toolbar row (right-aligned) with `ButtonGroup` + two `Toggle` buttons (`List` and `LayoutGrid` icons from lucide-react)
- Conditionally render `<ul>` list (existing) or `<ul className={grid()}>` with `PlantCard` items
- Grid layout: `grid grid-cols-2 sm:grid-cols-3 gap-3`

### Files to modify/create

| File | Action |
|------|--------|
| `src/lib/waterRatio.ts` | **Create** — shared `getWaterRatio` utility |
| `src/components/Plant.tsx` | **Modify** — import `getWaterRatio` from shared module |
| `src/components/PlantCard.tsx` | **Create** — grid card component |
| `src/components/PlantListClient.tsx` | **Modify** — add view toggle + grid rendering |

### Reused existing code

- `getWaterRatio()` logic from `src/components/Plant.tsx`
- `ButtonGroup` from `src/components/ui/ButtonGroup.tsx`
- `Toggle` (outline variant, sm size) from `src/components/ui/Toggle.tsx`
- `PlantActionsDialog` from `src/components/PlantActionsDialog/index.tsx`
- `TreeDeciduous` icon from lucide-react (same as `PlantImagePlaceholder.tsx`)
- Colors from `src/styles/palette.ts` (`colors.borderList`, `colors.waterBlueRgb`, `colors.pageBackground`, `cls.textPrimaryGreen`)

## Verification

1. `pnpm exec tsc --noEmit` — type check passes
2. `pnpm test` — unit tests pass
3. `pnpm exec biome check src/` — linting passes
4. Manual: toggle between list/grid views, verify gradient border intensity changes per plant, verify clicking a card opens the dialog
