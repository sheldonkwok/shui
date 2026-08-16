"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../api/client.ts";
import { colors } from "../../styles/palette.ts";

const WEEKS = 6;
const DAYS_PER_WEEK = 7;
const SPAN = WEEKS * DAYS_PER_WEEK;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

interface WateringHistoryGridProps {
  plantId: number;
  open: boolean;
}

export function WateringHistoryGrid({ plantId, open }: WateringHistoryGridProps) {
  const [dayColors, setDayColors] = useState<string[]>(() => Array(SPAN).fill(colors.borderList));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      const res = await apiClient.api.plants[":id"].waterings.$get({ param: { id: String(plantId) } });
      if (!res.ok || cancelled) return;
      const { waterings } = await res.json();

      const today = startOfDay(new Date());
      const fertilizedByDaysAgo = new Map<number, boolean>();
      for (const w of waterings) {
        const daysAgo = Math.round((today - startOfDay(new Date(w.wateringTime))) / (1000 * 60 * 60 * 24));
        if (daysAgo < 0 || daysAgo >= SPAN) continue;
        fertilizedByDaysAgo.set(daysAgo, fertilizedByDaysAgo.get(daysAgo) || w.fertilized);
      }

      const next = Array.from({ length: SPAN }, (_, i) => {
        const daysAgo = SPAN - 1 - i;
        if (!fertilizedByDaysAgo.has(daysAgo)) return colors.borderList;
        return fertilizedByDaysAgo.get(daysAgo) ? colors.toggleActive : colors.waterBlue;
      });
      if (!cancelled) setDayColors(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [plantId, open]);

  return (
    <div
      className="flex flex-1 min-w-0 box-border flex-col items-center justify-center gap-1 py-[18px] px-1.5"
      role="img"
      aria-label="Watering history, past 6 weeks"
    >
      {Array.from({ length: WEEKS }, (_, week) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size calendar grid, position is the identity
        <div key={week} className="flex flex-row items-center gap-1">
          {dayColors.slice(week * DAYS_PER_WEEK, week * DAYS_PER_WEEK + DAYS_PER_WEEK).map((color, day) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-size calendar grid, position is the identity
            <div key={day} className="w-3 h-3 rounded-[3px]" style={{ background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}
