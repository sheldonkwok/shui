"use client";

import { cva } from "class-variance-authority";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Sprout,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { apiClient } from "../../api/client.ts";
import { cls, colors } from "../../styles/palette.ts";
import type { WateringEntry } from "../../types.ts";
import { formatCalendarDaysAgo, formatWateringDay, formatWateringTime } from "../../utils.ts";
import { Separator } from "../ui/Separator.tsx";
import { Toggle } from "../ui/Toggle.tsx";

const panel = cva("flex w-full min-w-0 box-border flex-col gap-3.5 p-[18px]");
const header = cva("flex items-center gap-2");
const iconButton = cva([
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "flex h-7 w-7 shrink-0 items-center justify-center rounded border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
]);
const title = cva([cls.textPrimaryGreenDark, "flex-1 min-w-0 truncate text-base font-medium"]);
const siblingNav = cva(["flex items-center gap-0.5 text-[13px]", cls.textSecondary]);
const statsList = cva("flex flex-col gap-2");
const statRow = cva(["flex items-center gap-2 text-[13px]", cls.textSecondary]);
const controls = cva("flex items-center gap-2.5");
const fertilizeLabel = cva(["flex-1 min-w-0 text-[13px]", cls.textSecondary]);
const deleteButton = cva([
  cls.borderInput,
  "flex h-10 items-center gap-1.5 rounded-md border bg-transparent px-3 text-[13px] text-red-700 cursor-pointer transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed",
]);

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

interface WateringEditPanelProps {
  plantId: number;
  watering: WateringEntry;
  /** Full history, used to step between several waterings logged on the same day. */
  waterings: WateringEntry[];
  loggedIn: boolean;
  onSelectWatering: (wateringId: number) => void;
  onBack: () => void;
  /** Called after the watering was changed or removed, so the caller can refresh. */
  onChanged: () => Promise<void> | void;
}

export function WateringEditPanel({
  plantId,
  watering,
  waterings,
  loggedIn,
  onSelectWatering,
  onBack,
  onChanged,
}: WateringEditPanelProps) {
  const [pending, setPending] = useState(false);
  const wateredAt = new Date(watering.wateringTime);

  // Several waterings can share a calendar cell; the grid opens the last one and
  // this nav walks the rest.
  const sameDay = useMemo(() => {
    const day = startOfDay(new Date(watering.wateringTime));
    return waterings.filter((w) => startOfDay(new Date(w.wateringTime)) === day);
  }, [waterings, watering.wateringTime]);
  const position = sameDay.findIndex((w) => w.id === watering.id);

  const handleFertilizedChange = async (fertilized: boolean) => {
    setPending(true);
    try {
      await apiClient.api.plants[":id"].waterings[":wateringId"].$patch({
        param: { id: String(plantId), wateringId: String(watering.id) },
        json: { fertilized },
      });
      await onChanged();
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    setPending(true);
    try {
      await apiClient.api.plants[":id"].waterings[":wateringId"].$delete({
        param: { id: String(plantId), wateringId: String(watering.id) },
      });
      await onChanged();
      onBack();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={panel()}>
      <div className={header()}>
        <button type="button" className={iconButton()} onClick={onBack} aria-label="Back to plant actions">
          <ArrowLeft size={18} />
        </button>
        <span className={title()}>Watering</span>
        {sameDay.length > 1 && (
          <div className={siblingNav()}>
            <button
              type="button"
              className={iconButton()}
              onClick={() => onSelectWatering(sameDay[position - 1]!.id)}
              disabled={position <= 0}
              aria-label="Previous watering this day"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {position + 1}/{sameDay.length}
            </span>
            <button
              type="button"
              className={iconButton()}
              onClick={() => onSelectWatering(sameDay[position + 1]!.id)}
              disabled={position === sameDay.length - 1}
              aria-label="Next watering this day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <Separator />

      <div className={statsList()}>
        <div className={statRow()} role="img" aria-label="Watering date">
          <CalendarDays size={16} />
          <span>{formatWateringDay(wateredAt)}</span>
        </div>
        <div className={statRow()} role="img" aria-label="Watering time">
          <Clock size={16} />
          <span>{formatWateringTime(wateredAt)}</span>
        </div>
        <div className={statRow()} role="img" aria-label="Watered">
          <Droplets size={16} />
          <span>{formatCalendarDaysAgo(wateredAt)}</span>
        </div>
      </div>

      <Separator />

      <div className={controls()}>
        <Toggle
          pressed={watering.fertilized}
          onPressedChange={handleFertilizedChange}
          disabled={!loggedIn || pending}
          variant="outline"
          size="lg"
          aria-label="Toggle fertilize"
        >
          <Sprout
            size={18}
            fill={watering.fertilized ? colors.lightGreen : "none"}
            color={watering.fertilized ? colors.lightGreen : undefined}
          />
        </Toggle>
        <span className={fertilizeLabel()}>{watering.fertilized ? "Fertilized" : "Not fertilized"}</span>
        <button
          type="button"
          className={deleteButton()}
          onClick={handleDelete}
          disabled={!loggedIn || pending}
          aria-label="Delete watering"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
