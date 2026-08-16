"use client";

import { cva } from "class-variance-authority";
import { useRouter } from "waku";
import { useSession } from "../../hooks/useSession.ts";
import { Dialog, DialogContent } from "../ui/Dialog.tsx";
import { ButtonContainer } from "./ButtonContainer.tsx";
import { EditableName } from "./EditableName.tsx";
import { EditableSpecies } from "./EditableSpecies.tsx";
import { PlantStats } from "./PlantStats.tsx";
import { WateringHistoryGrid } from "./WateringHistoryGrid.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
  species: string | null;
  lastWatered: Date | null;
  lastFertilized: Date | null;
  avgWateringIntervalDays: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dialogBody = cva("flex flex-row overflow-hidden p-0");
const leftBlock = cva(
  "w-[186px] box-border flex-shrink-0 pt-[18px] pr-3 pb-[18px] pl-5 flex flex-col gap-3.5",
);
const nameBlock = cva("flex flex-col gap-0.5");

export function PlantActionsDialog({
  plantId,
  plantName,
  species,
  lastWatered: lastWateredDate,
  lastFertilized: lastFertilizedDate,
  avgWateringIntervalDays,
  open,
  onOpenChange,
}: PlantActionsDialogProps) {
  const router = useRouter();
  const { loggedIn } = useSession();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogBody()} onOpenAutoFocus={(e) => e.preventDefault()}>
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
        <WateringHistoryGrid plantId={plantId} open={open} />
        <ButtonContainer plantId={plantId} loggedIn={loggedIn} open={open} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
