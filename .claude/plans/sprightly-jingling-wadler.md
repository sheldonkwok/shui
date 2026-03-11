# Plan: Reuse Fill Animation as Post-Click Feedback on Water Button

## Context

The water button in the plant action dialog already shows a `fill-pulse` animation on hover (the droplet icon pulses between transparent and opaque white). After clicking, the button triggers an async API call before the dialog closes. Currently there's no visual feedback during that brief async period. The goal is to keep the fill animation running after the click — until the API call completes and the dialog closes — so the user knows their action registered.

## Implementation

**File to modify:** `/home/sheldon/Work/shui/src/components/PlantActionsDialog/ButtonContainer.tsx`

### Changes

1. **Add `isWatering` state:**
   ```tsx
   const [isWatering, setIsWatering] = useState(false);
   ```

2. **Update `handleWater` to set/clear the state:**
   ```tsx
   const handleWater = async () => {
     setIsWatering(true);
     await apiClient.api.plants[":id"].water.$post({
       param: { id: String(plantId) },
       json: { fertilized: fertilizeToggled },
     });
     setFertilizeToggled(false);
     setIsWatering(false);
     onOpenChange(false);
     router.reload();
   };
   ```

3. **Apply animation class conditionally on the button:**
   ```tsx
   <button
     className={`${waterButton()} ${isWatering ? "[&>svg]:animate-[fill-pulse_1s_ease-in-out_infinite]" : ""}`}
     type="button"
     onClick={handleWater}
     disabled={!loggedIn || isWatering}
   >
     <Droplets size={18} />
   </button>
   ```
   Disabling during the async call also prevents double-submission.

4. **Reset `isWatering` in the `useEffect` cleanup** (edge case: if dialog is closed externally mid-flight):
   ```tsx
   useEffect(() => {
     if (!open) {
       setFertilizeToggled(false);
       setDelayDays(1);
       setIsWatering(false);
     }
   }, [open]);
   ```

No new files, no new CSS — reuses the existing `fill-pulse` keyframes from `global.css` and the Tailwind arbitrary animation syntax already used on hover.

## Verification

1. Open the plant action dialog.
2. Click the water button — the droplet icon should start the fill-pulse animation immediately.
3. After the API call completes, the dialog closes (animation is gone with it).
4. Confirm the plant's last-watered date updates after page reload.
5. Run `pnpm check` and `pnpm test` to confirm no regressions.
