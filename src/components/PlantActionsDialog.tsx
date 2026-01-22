"use client";

import { useState } from "react";
import { css } from "../../styled-system/css";
import { useRouter } from "waku";
import { waterPlant } from "../actions/plants.ts";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/Dialog.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
}

const triggerButtonStyles = css({
  backgroundColor: "#4a7c59",
  color: "white",
  border: "none",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.85em",
  cursor: "pointer",
  transition: "background-color 0.2s",
  alignItems: "center",
  gap: "4px",
  _hover: {
    backgroundColor: "#3d6b4a",
  },
  _active: {
    transform: "translateY(1px)",
  },
});

const fertilizeButtonStyles = css({
  backgroundColor: "#d8b88b",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  fontSize: "0.9em",
  cursor: "pointer",
  transition: "background-color 0.2s",
  _hover: {
    backgroundColor: "#965a3e",
  },
});

const waterButtonStyles = css({
  backgroundColor: "#6d94c5",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  fontSize: "0.9em",
  cursor: "pointer",
  transition: "background-color 0.2s",
  _hover: {
    backgroundColor: "#357abd",
  },
});

const buttonContainerStyles = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "8px",
  marginTop: "12px",
});

export function PlantActionsDialog({ plantId, plantName }: PlantActionsDialogProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWaterWithFertilizer = async () => {
    await waterPlant(plantId, true);
    setIsDialogOpen(false);
    router.reload();
  };

  const handleWater = async () => {
    await waterPlant(plantId, false);
    setIsDialogOpen(false);
    router.reload();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className={triggerButtonStyles} type="button">
          <ChevronRight size={16} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{plantName}</DialogTitle>
        <div className={buttonContainerStyles}>
          <button
            className={fertilizeButtonStyles}
            type="button"
            onClick={handleWaterWithFertilizer}
          >
            Fertilize
          </button>
          <button
            className={waterButtonStyles}
            type="button"
            onClick={handleWater}
          >
            Water
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
