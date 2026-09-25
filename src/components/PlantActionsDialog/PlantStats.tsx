import { cva } from "class-variance-authority";
import { Cylinder, Droplets, RefreshCcw, Sprout, X } from "lucide-react";
import { cls } from "../../styles/palette.ts";
import { calendarDaysAgo } from "../../utils.ts";

const statsList = cva("flex flex-col gap-2");
const statRow = cva(["flex items-center gap-2 text-[13px]", cls.textSecondary]);

interface PlantStatsProps {
  lastWateredDate: Date | null;
  avgWateringIntervalDays: number | null;
  lastFertilizedDate: Date | null;
  lastRepottedDate: Date | null;
}

function DaysAgo({ date }: { date: Date | null }) {
  return date ? <span>{calendarDaysAgo(date)}d</span> : <X size={14} />;
}

export function PlantStats({
  lastWateredDate,
  avgWateringIntervalDays,
  lastFertilizedDate,
  lastRepottedDate,
}: PlantStatsProps) {
  return (
    <div className={statsList()}>
      <div className={statRow()} role="img" aria-label="Last watered">
        <Droplets size={16} />
        <DaysAgo date={lastWateredDate} />
      </div>
      <div className={statRow()} role="img" aria-label="Average watering interval">
        <RefreshCcw size={16} />
        {avgWateringIntervalDays !== null ? (
          <span>~{Math.round(avgWateringIntervalDays)}d</span>
        ) : (
          <X size={14} />
        )}
      </div>
      <div className={statRow()} role="img" aria-label="Last fertilized">
        <Sprout size={16} />
        <DaysAgo date={lastFertilizedDate} />
      </div>
      {lastRepottedDate && (
        <div className={statRow()} role="img" aria-label="Last repotted">
          <Cylinder size={16} />
          <span>{calendarDaysAgo(lastRepottedDate)}d</span>
        </div>
      )}
    </div>
  );
}
