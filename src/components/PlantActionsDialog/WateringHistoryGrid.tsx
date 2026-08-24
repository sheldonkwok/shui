"use client";

import { cva } from "class-variance-authority";
import { useMemo } from "react";
import { colors } from "../../styles/palette.ts";
import type { WateringEntry } from "../../types.ts";
import { formatWateringDay } from "../../utils.ts";

const WEEKS = 6;
const DAYS_PER_WEEK = 7;
const SPAN = WEEKS * DAYS_PER_WEEK;
const DAY_MS = 1000 * 60 * 60 * 24;

const grid = cva(
  "flex flex-1 min-w-fit box-border flex-col items-center justify-center gap-[3px] py-[18px] px-1 min-[480px]:gap-1 min-[480px]:px-1.5",
);
const weekRow = cva("flex flex-row items-center gap-[3px] min-[480px]:gap-1");
const dayCell = cva("w-2.5 h-2.5 min-[480px]:w-3 min-[480px]:h-3 rounded-[3px] p-0 border-none", {
  variants: {
    watered: {
      true: "cursor-pointer transition-transform hover:scale-125 focus-visible:outline-none focus-visible:scale-125",
      false: "",
    },
  },
  defaultVariants: { watered: false },
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

interface WateringHistoryGridProps {
  waterings: WateringEntry[];
  /** Opens the edit view for the clicked day's watering. */
  onSelectWatering: (wateringId: number) => void;
}

export function WateringHistoryGrid({ waterings, onSelectWatering }: WateringHistoryGridProps) {
  // Waterings bucketed by how many calendar days ago they happened, newest last
  // within a bucket (the API returns them oldest first).
  const byDaysAgo = useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = new Map<number, WateringEntry[]>();
    for (const w of waterings) {
      const daysAgo = Math.round((today - startOfDay(new Date(w.wateringTime))) / DAY_MS);
      if (daysAgo < 0 || daysAgo >= SPAN) continue;
      const bucket = buckets.get(daysAgo);
      if (bucket) bucket.push(w);
      else buckets.set(daysAgo, [w]);
    }
    return buckets;
  }, [waterings]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: a labelled grid of day buttons, not a form fieldset
    <div className={grid()} role="group" aria-label="Watering history, past 6 weeks">
      {Array.from({ length: WEEKS }, (_, week) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size calendar grid, position is the identity
        <div key={week} className={weekRow()}>
          {Array.from({ length: DAYS_PER_WEEK }, (_, day) => {
            const daysAgo = SPAN - 1 - (week * DAYS_PER_WEEK + day);
            const dayWaterings = byDaysAgo.get(daysAgo);

            if (!dayWaterings) {
              return <div key={daysAgo} className={dayCell()} style={{ background: colors.borderList }} />;
            }

            // The last watering of the day is the one the cell edits; extra ones
            // are reachable from the edit view.
            const latest = dayWaterings[dayWaterings.length - 1]!;
            const fertilized = dayWaterings.some((w) => w.fertilized);

            return (
              <button
                key={daysAgo}
                type="button"
                className={dayCell({ watered: true })}
                style={{ background: fertilized ? colors.toggleActive : colors.waterBlue }}
                onClick={() => onSelectWatering(latest.id)}
                aria-label={`Edit watering on ${formatWateringDay(new Date(latest.wateringTime))}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
