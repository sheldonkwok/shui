"use client";

import { useState, useRef } from "react";
import { css, cx } from "../../styled-system/css";
import { useRouter } from "waku";
import { waterPlant, renamePlant } from "../actions/plants.ts";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./ui/Dialog.tsx";

interface PlantActionsDialogProps {
  plantId: number;
  plantName: string;
  lastFertilized: Date | null;
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

const lastFertilizedStyles = css({
  color: "#999",
  fontSize: "0.85em",
  marginTop: "4px",
});

const WEEK = 7;

const formatLastFertilized = (date: Date | null) => {
  if (!date) return "Never fertilized";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Last fertilized today";
  if (diffDays === 1) return "Last fertilized yesterday";
  if (diffDays <= WEEK * 3) return `Last fertilized ${diffDays} days ago`;

  return `Last fertilized ${Math.floor(diffDays / WEEK)} weeks ago`;
};

const nameContainerStyles = css({
  position: "relative",
});

const editableNameStyles = css({
  cursor: "pointer",
  _hover: {
    opacity: 0.7,
  },
});

const editableNameHiddenStyles = css({
  visibility: "hidden",
  pointerEvents: "none",
});

const nameInputStyles = css({
  position: "absolute",
  top: "0",
  left: "0",
  fontSize: "1.125rem",
  lineHeight: "normal",
  fontWeight: 600,
  width: "33%",
  height: "100%",
  padding: "0",
  border: "none",
  borderBottom: "2px solid #2d5f3f",
  borderRadius: "0",
  backgroundColor: "transparent",
  _focus: {
    outline: "none",
  },
});

const nameInputHiddenStyles = css({
  visibility: "hidden",
  pointerEvents: "none",
});

export function PlantActionsDialog({ plantId, plantName, lastFertilized }: PlantActionsDialogProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      await renamePlant(plantId, trimmed);
      router.reload();
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
        <div className={nameContainerStyles}>
          <DialogTitle
            className={cx(editableNameStyles, isEditing && editableNameHiddenStyles)}
            onClick={handleNameClick}
          >
            {name}
          </DialogTitle>
          <input
            ref={inputRef}
            className={cx(nameInputStyles, !isEditing && nameInputHiddenStyles)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
          />
        </div>
        <p className={lastFertilizedStyles}>{formatLastFertilized(lastFertilized)}</p>
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
