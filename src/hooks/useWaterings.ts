"use client";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client.ts";
import type { WateringEntry } from "../types.ts";

/**
 * Watering history for a plant, fetched while `enabled` (i.e. while the plant's
 * dialog is open). `reload` refetches after a watering is edited or deleted.
 */
export function useWaterings(plantId: number, enabled: boolean) {
  const [waterings, setWaterings] = useState<WateringEntry[]>([]);

  const reload = useCallback(async () => {
    const res = await apiClient.api.plants[":id"].waterings.$get({ param: { id: String(plantId) } });
    if (!res.ok) return;
    const { waterings: history } = await res.json();
    setWaterings(history);
  }, [plantId]);

  useEffect(() => {
    if (!enabled) return;
    reload();
  }, [enabled, reload]);

  return { waterings, reload };
}
