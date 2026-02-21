"use client";

import { cva, cx } from "class-variance-authority";
import { Droplets, Sprout, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../api/client.ts";
import { useSession } from "../hooks/useSession.ts";
import { Dialog, DialogContent, DialogTitle } from "./ui/Dialog.tsx";
import { Toggle } from "./ui/Toggle.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const waterButton = cva(
  "bg-[#6d94c5] text-white border-none h-9 px-3 rounded text-[0.9em] transition-colors hover:bg-[#357abd] hover:[&>svg]:fill-current disabled:opacity-40 disabled:cursor-not-allowed",
);
const buttonContainer = cva("flex flex-row items-end justify-end gap-4 mt-3");
const buttonGroup = cva("flex flex-col items-center gap-1");
const lastWateredStyle = cva("text-[#999] text-[0.85em] flex items-center justify-center my-[0.25em]");
const lastFertilizedStyle = cva("text-[#999] text-[0.85em] flex items-center justify-center my-[0.25em]");

const formatDaysAgo = (date: Date | null): { days: number } | null => {
  if (!date) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  return { days };
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
  canEdit: boolean;
}

function EditableName({ plantId, plantName, onRenamed, canEdit }: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(plantName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNameClick = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleNameBlur = async () => {
    setIsEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== plantName) {
      await apiClient.api.plants[":id"].$patch({
        param: { id: String(plantId) },
        json: { name: trimmed },
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
  const { loggedIn } = useSession();
  const [fertilizeToggled, setFertilizeToggled] = useState(false);

  const handleWater = async () => {
    await apiClient.api.plants[":id"].water.$post({
      param: { id: String(plantId) },
      json: { fertilized: fertilizeToggled },
    });
    setFertilizeToggled(false);
    onOpenChange(false);
    router.reload();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setFertilizeToggled(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <EditableName
          plantId={plantId}
          plantName={plantName}
          onRenamed={() => router.reload()}
          canEdit={loggedIn}
        />
        <div className={buttonContainer()}>
          <div className={buttonGroup()}>
            <p className={lastFertilizedStyle()}>
              {(() => {
                const r = formatDaysAgo(lastFertilizedDate);
                return r ? `${r.days}d` : <X size={14} />;
              })()}
            </p>
            <Toggle
              pressed={fertilizeToggled}
              onPressedChange={setFertilizeToggled}
              disabled={!loggedIn}
              variant="outline"
              aria-label="Toggle fertilize"
            >
              <Sprout size={18} fill={fertilizeToggled ? "currentColor" : "none"} />
            </Toggle>
          </div>
          <div className={buttonGroup()}>
            <p className={lastWateredStyle()}>
              {(() => {
                const r = formatDaysAgo(lastWateredDate);
                return r ? `${r.days}d` : <X size={14} />;
              })()}
            </p>
            <button className={waterButton()} type="button" onClick={handleWater} disabled={!loggedIn}>
              <Droplets size={18} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
