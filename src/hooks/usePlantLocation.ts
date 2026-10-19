"use client";
import { useEffect, useState } from "react";
import type { PlantLocation } from "../types.ts";

const STORAGE_KEY = "shui:location";

/** The indoor/outdoor view, remembered per browser so a reload keeps the same list. */
export function usePlantLocation() {
  const [location, setLocation] = useState<PlantLocation>("indoor");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "outdoor") setLocation("outdoor");
    } catch {
      // Storage can be unavailable (private mode); the view just starts indoors.
    }
  }, []);

  const change = (next: PlantLocation) => {
    setLocation(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered, but the toggle still works for this visit.
    }
  };

  return [location, change] as const;
}
