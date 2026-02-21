"use client";

import { cva, cx } from "class-variance-authority";
import { useRef, useState } from "react";
import { useRouter } from "waku";
import { formatCalendarDaysAgo } from "../utils.ts";
import { Dialog, DialogContent, DialogTitle } from "./ui/Dialog.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fertilizeButton = cva(
  "bg-[#d8b88b] text-white border-none px-4 py-2 rounded text-[0.9em] cursor-pointer transition-colors hover:bg-[#965a3e]",
);
const waterButton = cva(
  "bg-[#6d94c5] text-white border-none px-4 py-2 rounded text-[0.9em] cursor-pointer transition-colors hover:bg-[#357abd]",
);
const buttonContainer = cva("flex flex-col items-end gap-2 mt-3");
const lastWateredStyle = cva("text-[#999] text-[0.85em] mt-1");
const lastFertilizedStyle = cva("text-[#999] text-[0.85em] mt-1");

const formatMostRecentWatering = (date: Date | null) => {
  if (!date) return "Most recent watering: never";
  return `Most recent watering ${formatCalendarDaysAgo(date).toLowerCase()}`;
};

const formatLastFertilized = (date: Date | null) => {
  if (!date) return "Not fertilized recently";
  return `Last fertilized ${formatCalendarDaysAgo(date).toLowerCase()}`;
};

const nameContainer = cva("relative");
const editableName = cva("cursor-pointer hover:opacity-70");
const editableNameHidden = cva("invisible pointer-events-none");
const nameInput = cva(
  "absolute top-0 left-0 text-lg leading-normal font-semibold p-0 border-none border-b-2 border-b-[#2d5f3f] rounded-none bg-transparent focus:outline-none",
);
const nameInputHidden = cva("invisible pointer-events-none");

interface EditableNameProps {
  plantId: number;
  plantName: string;
  onRenamed: () => void;
}

function EditableName({ plantId, plantName, onRenamed }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(plantName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleNameBlur = async () => {
    setIsEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== plantName) {
      await fetch(`/api/plants/${plantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      onRenamed();
    } else {
      setName(plantName);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setName(plantName);
      setIsEditing(false);
    }
  };

  return (
    <div className={nameContainer()}>
      <DialogTitle
        className={cx(editableName(), isEditing && editableNameHidden())}
        onClick={handleNameClick}
      >
        {name}
      </DialogTitle>
      <input
        ref={inputRef}
        className={cx(nameInput(), !isEditing && nameInputHidden())}
        size={Math.max(1, name.length)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
      />
    </div>
  );
}

export function PlantActionsDialog({
  plantId,
  plantName,
  lastWatered: lastWateredDate,
  lastFertilized: lastFertilizedDate,
  open,
  onOpenChange,
}: PlantActionsDialogProps) {
  const router = useRouter();

  const handleWaterWithFertilizer = async () => {
    await fetch(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: true }),
    });
    onOpenChange(false);
    router.reload();
  };

  const handleWater = async () => {
    await fetch(`/api/plants/${plantId}/water`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fertilized: false }),
    });
    onOpenChange(false);
    router.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EditableName plantId={plantId} plantName={plantName} onRenamed={() => router.reload()} />
        <p className={lastWateredStyle()}>{formatMostRecentWatering(lastWateredDate)}</p>
        <p className={lastFertilizedStyle()}>{formatLastFertilized(lastFertilizedDate)}</p>
        <div className={buttonContainer()}>
          <button className={fertilizeButton()} type="button" onClick={handleWaterWithFertilizer}>
            Fertilize
          </button>
          <button className={waterButton()} type="button" onClick={handleWater}>
            Water
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
