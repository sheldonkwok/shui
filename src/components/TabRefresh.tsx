"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "waku";

export function TabRefresh() {
  const router = useRouter();
  const lastUpdateTime = useRef(Date.now());

  // Refresh page when user returns to tab after extended inactivity
  useEffect(() => {
    const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.current;

        if (timeSinceLastUpdate > INACTIVITY_THRESHOLD) {
          router.reload();
          lastUpdateTime.current = Date.now();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
