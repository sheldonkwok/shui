"use client";

import { useState } from "react";
import { css } from "../../styled-system/css";
import { useRouter } from "waku";
import { waterPlant } from "../actions/plants.ts";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "./ui/Dialog.tsx";

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

const waterActionButtonStyles = css({
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

export function PlantActionsDialog({ plantId, plantName }: PlantActionsDialogProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleWater = async () => {
    await waterPlant(plantId);
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
        <DialogTitle>Water {plantName}</DialogTitle>
        <DialogDescription>
          Record a watering for this plant.
        </DialogDescription>
        <button
          className={waterActionButtonStyles}
          type="button"
          onClick={handleWater}
        >
          Water
        </button>
      </DialogContent>
    </Dialog>
  );
}
