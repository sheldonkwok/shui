"use client";

import { cva } from "class-variance-authority";
import { useRouter } from "waku";
import { useSession } from "../../hooks/useSession.ts";
import { Dialog, DialogContent } from "../ui/Dialog.tsx";
import { Separator } from "../ui/Separator.tsx";
import { ButtonContainer } from "./ButtonContainer.tsx";
import { EditableName } from "./EditableName.tsx";
import { EditableSpecies } from "./EditableSpecies.tsx";
import { PlantImagePlaceholder } from "./PlantImagePlaceholder.tsx";

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
const dialogRightContent = cva("flex flex-col px-4 flex-1");

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
        <PlantImagePlaceholder />
        <Separator orientation="vertical" />
        <div className={dialogRightContent()}>
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
          <ButtonContainer
            plantId={plantId}
            lastWateredDate={lastWateredDate}
            lastFertilizedDate={lastFertilizedDate}
            avgWateringIntervalDays={avgWateringIntervalDays}
            loggedIn={loggedIn}
            open={open}
            onOpenChange={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
