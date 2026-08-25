"use client";

import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";
import { useRouter } from "waku";
import { useWaterings } from "../../hooks/useWaterings.ts";
import { Dialog, DialogContent } from "../ui/Dialog.tsx";
import { ButtonContainer } from "./ButtonContainer.tsx";
import { EditableName } from "./EditableName.tsx";
import { EditableSpecies } from "./EditableSpecies.tsx";
import { PlantStats } from "./PlantStats.tsx";
import { WateringEditPanel } from "./WateringEditPanel.tsx";
import { WateringHistoryGrid } from "./WateringHistoryGrid.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
  species: string | null;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  avgWateringIntervalDays: number | null;
  loggedIn: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dialogBody = cva("flex flex-row overflow-hidden p-0");
// The edit view takes over the whole dialog, so it stacks instead of splitting
// into the three action columns.
const editBody = cva("flex flex-col overflow-hidden p-0");
// The calendar rail and button column hold their intrinsic widths; this block is
// the only one that gives way when the dialog is narrower than the three columns.
const leftBlock = cva(
  "w-[186px] min-w-0 box-border pt-[18px] pr-2 pb-[18px] pl-3.5 min-[480px]:pr-3 min-[480px]:pl-5 flex flex-col gap-3.5",
);
const nameBlock = cva("flex flex-col gap-0.5");

export function PlantActionsDialog({
  plantId,
  plantName,
  species,
  lastWatered: lastWateredDate,
  lastFertilized: lastFertilizedDate,
  avgWateringIntervalDays,
  loggedIn,
  open,
  onOpenChange,
}: PlantActionsDialogProps) {
  const router = useRouter();
  const { waterings, reload } = useWaterings(plantId, open);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Closing the dialog drops the user back on the plant list, so the next open
  // always starts on the actions view.
  useEffect(() => {
    if (!open) setEditingId(null);
  }, [open]);

  // Falls back to the actions view if the edited watering is gone (e.g. deleted).
  const editing = editingId === null ? undefined : waterings.find((w) => w.id === editingId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={editing ? editBody() : dialogBody()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {editing ? (
          <WateringEditPanel
            plantId={plantId}
            watering={editing}
            waterings={waterings}
            loggedIn={loggedIn}
            onSelectWatering={setEditingId}
            onBack={() => setEditingId(null)}
            onChanged={async () => {
              await Promise.all([reload(), router.reload()]);
            }}
          />
        ) : (
          <>
            <div className={leftBlock()}>
              <div className={nameBlock()}>
                <EditableName
                  plantId={plantId}
                  plantName={plantName}
                  onRenamed={() => router.reload()}
                  canEdit={loggedIn}
                />
                <EditableSpecies
                  plantId={plantId}
                  species={species}
                  onClassified={() => router.reload()}
                  canEdit={loggedIn}
                />
              </div>
              <PlantStats
                lastWateredDate={lastWateredDate}
                avgWateringIntervalDays={avgWateringIntervalDays}
                lastFertilizedDate={lastFertilizedDate}
              />
            </div>
            <WateringHistoryGrid waterings={waterings} onSelectWatering={setEditingId} />
            <ButtonContainer plantId={plantId} loggedIn={loggedIn} open={open} onOpenChange={onOpenChange} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
