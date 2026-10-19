"use client";

import { cva } from "class-variance-authority";
import { Droplets } from "lucide-react";
import { useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../api/client.ts";
import { cls, colors } from "../styles/palette.ts";
import type { IrrigationSummary } from "../types.ts";
import { formatCalendarDaysAgo } from "../utils.ts";
import { getExpectedDayRatio } from "../water-utils.ts";

const row = cva("flex items-center gap-3 h-[46px] pl-3 pr-[18px]");
const gaugeTrack = cva([
  cls.bgBorderList,
  "w-1 h-6 rounded-full flex flex-col justify-end overflow-hidden shrink-0",
]);
const label = cva([cls.textPrimaryGreen, "flex-1 min-w-0 font-medium text-base truncate"]);
const lastRun = cva([cls.textSecondary, "text-[13px] whitespace-nowrap"]);
const runButton = cva([
  cls.bgWaterBlue,
  cls.hoverBgWaterBlueDark,
  "w-9 h-8 flex items-center justify-center text-white border-none rounded cursor-pointer transition-colors active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed",
]);
const errorText = cva("px-3 text-[11px] leading-tight text-red-700");

interface IrrigationRowProps {
  irrigation: IrrigationSummary;
  loggedIn: boolean;
}

/** One gauge and button for the whole garden, since irrigation waters every outdoor plant at once. */
export function IrrigationRow({ irrigation, loggedIn }: IrrigationRowProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const ratio = getExpectedDayRatio(irrigation.daysUntilNextRun, irrigation.avgIntervalDays);

  const handleRun = async () => {
    setPending(true);
    setFailed(false);
    try {
      const res = await apiClient.api.garden.irrigate.$post();
      if (!res.ok) {
        setFailed(true);
        return;
      }
      router.reload();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className={row()}>
        <div className={gaugeTrack()}>
          <div
            style={{
              width: "100%",
              height: `${Math.max(ratio, 0.08) * 100}%`,
              background: `rgba(${colors.waterBlueRgb}, ${ratio || 0.15})`,
              borderRadius: "999px",
            }}
          />
        </div>
        <span className={label()}>Irrigation</span>
        <span className={lastRun()}>
          {irrigation.lastRun ? formatCalendarDaysAgo(irrigation.lastRun) : "Never run"}
        </span>
        {loggedIn && (
          <button
            type="button"
            className={runButton()}
            onClick={handleRun}
            disabled={pending}
            aria-label="Log irrigation run"
          >
            <Droplets size={18} />
          </button>
        )}
      </div>
      {failed && (
        <p className={errorText()} role="alert">
          Couldn't log irrigation
        </p>
      )}
    </>
  );
}
