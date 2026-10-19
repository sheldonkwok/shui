"use client";

import { cva } from "class-variance-authority";
import { House, Trees } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../../api/client.ts";
import { cls } from "../../styles/palette.ts";
import type { PlantLocation } from "../../types.ts";

const moveButton = cva([
  cls.borderInput,
  cls.textPrimaryGreen,
  cls.hoverBgHover,
  "self-start inline-flex h-8 items-center gap-1.5 rounded-md border bg-transparent px-2.5 text-[13px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
]);
const moveError = cva("text-[11px] leading-tight text-red-700");

interface LocationButtonProps {
  plantId: number;
  location: PlantLocation;
  canEdit: boolean;
  onMoved: () => void;
}

/** Moves a plant between the indoor list and the outdoor garden. */
export function LocationButton({ plantId, location, canEdit, onMoved }: LocationButtonProps) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const target: PlantLocation = location === "indoor" ? "outdoor" : "indoor";

  const handleMove = async () => {
    setPending(true);
    setFailed(false);
    try {
      const res = await apiClient.api.plants[":id"].$patch({
        param: { id: String(plantId) },
        json: { location: target },
      });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      onMoved();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button type="button" className={moveButton()} onClick={handleMove} disabled={!canEdit || pending}>
        {target === "outdoor" ? <Trees size={14} /> : <House size={14} />}
        {target === "outdoor" ? "Move outdoors" : "Move indoors"}
      </button>
      {failed && (
        <p className={moveError()} role="alert">
          Couldn't move plant
        </p>
      )}
    </>
  );
}
