# Plan: Animate Water Button Fill — Continuous Pulse on Hover

## Context
The water button fill currently transitions once from transparent to white on hover-in and back on hover-out (1s each). The user wants the fill to **continuously pulse** (fill → unfill → fill → ...) while the cursor is over the button, and smoothly revert to transparent when hover ends.

## Implementation

### Step 1 — Add keyframe + theme animation in `src/styles/global.css`

```css
@theme {
  --animate-fill-pulse: fill-pulse 1s ease-in-out infinite;
}

@keyframes fill-pulse {
  0%, 100% { fill: rgba(255, 255, 255, 0); }
  50%       { fill: rgba(255, 255, 255, 1); }
}
```

With Tailwind v4, `--animate-fill-pulse` in `@theme` exposes `animate-fill-pulse` as a utility class automatically.

### Step 2 — Update `waterButton` CVA in `src/components/PlantActionsDialog/ButtonContainer.tsx`

**Before (current state):**
```
[&>svg]:fill-white/0 hover:[&>svg]:fill-white [&>svg]:transition-[fill] [&>svg]:duration-1000
```

**After:**
```
[&>svg]:fill-white/0 [&>svg]:transition-[fill] [&>svg]:duration-1000 hover:[&>svg]:animate-fill-pulse
```

Changes:
- Remove `hover:[&>svg]:fill-white` (the static hover fill target)
- Add `hover:[&>svg]:animate-fill-pulse` to apply the continuous pulse animation on hover

### How it works
- **Default state**: `fill-white/0` (transparent) with a `transition-[fill]` enabled
- **On hover**: `animate-fill-pulse` takes over, looping fill between transparent ↔ white every 1s. CSS animations supersede transitions while active.
- **On hover exit**: animation class is removed; CSS transitions kick in to smoothly return fill to transparent (`fill-white/0`) over 1s.

## Files to Modify
- `src/styles/global.css` — add `@theme` block and `@keyframes`
- `src/components/PlantActionsDialog/ButtonContainer.tsx` — update `waterButton` CVA classes

## Verification
1. Open the app and navigate to a plant's action dialog
2. Hover over the water (droplets) button — icon should continuously pulse (fill ↔ transparent) while cursor is over it
3. Move cursor away — icon should smoothly fade back to transparent over ~1s
4. Run `pnpm check` and `pnpm test` to confirm no regressions
