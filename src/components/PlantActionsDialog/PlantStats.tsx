import { cva } from "class-variance-authority";
import { Clock, Cylinder, Droplets, RefreshCcw, Sprout, X } from "lucide-react";
import { cls } from "../../styles/palette.ts";
import { calendarDaysAgo } from "../../utils.ts";

// Rows share the parent's columns (icon, value, extra) so the values right-align
// together and the "d" suffixes line up even when one carries a "~" prefix.
const statsList = cva("grid grid-cols-[auto_auto_auto] justify-start gap-y-2");
const statRow = cva([
  "col-span-3 grid grid-cols-subgrid items-center gap-x-2 text-[13px] tabular-nums",
  cls.textSecondary,
]);
const statValue = cva("justify-self-end");
const delayValue = cva("flex items-center gap-1 pl-1");

interface PlantStatsProps {
  lastWateredDate: Date | null;
  avgWateringIntervalDays: number | null;
  delayDaysRemaining: number | null;
  lastFertilizedDate: Date | null;
  lastRepottedDate: Date | null;
}

function DaysAgo({ date }: { date: Date | null }) {
  return date ? (
    <span className={statValue()}>{calendarDaysAgo(date)}d</span>
  ) : (
    <X size={14} className={statValue()} />
  );
}

export function PlantStats({
  lastWateredDate,
  avgWateringIntervalDays,
  delayDaysRemaining,
  lastFertilizedDate,
  lastRepottedDate,
}: PlantStatsProps) {
  return (
    <div className={statsList()}>
      <div className={statRow()} role="img" aria-label="Last watered">
        <Droplets size={16} />
        <DaysAgo date={lastWateredDate} />
      </div>
      <div
        className={statRow()}
        role="img"
        aria-label={
          delayDaysRemaining !== null
            ? `Average watering interval, delayed ${delayDaysRemaining}d`
            : "Average watering interval"
        }
      >
        <RefreshCcw size={16} />
        {avgWateringIntervalDays !== null ? (
          <span className={statValue()}>~{Math.round(avgWateringIntervalDays)}d</span>
        ) : (
          <X size={14} className={statValue()} />
        )}
        {delayDaysRemaining !== null && (
          <span className={delayValue()}>
            <Clock size={14} />
            {delayDaysRemaining}d
          </span>
        )}
      </div>
      <div className={statRow()} role="img" aria-label="Last fertilized">
        <Sprout size={16} />
        <DaysAgo date={lastFertilizedDate} />
      </div>
      {lastRepottedDate && (
        <div className={statRow()} role="img" aria-label="Last repotted">
          <Cylinder size={16} />
          <DaysAgo date={lastRepottedDate} />
        </div>
      )}
    </div>
  );
}
