"use client";

import { cva } from "class-variance-authority";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "waku";
import { apiClient } from "../api/client.ts";
import { useSession } from "../hooks/useSession.ts";
import { cls } from "../styles/palette.ts";
import type { PlantWithStats } from "../types.ts";
import { Plant } from "./Plant.tsx";

const container = cva("mb-10");
// pt-[52px] reserves room above the panel for the logo mark, which sinks
// 12px into the panel's top edge (64px mark, 52px of it stays above).
const panelWrap = cva("relative pt-[52px]");
const logoMark = cva("absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 z-10 [image-rendering:pixelated]");
// Sits on the right edge of the dirt strip: top = panel top (52px) + dirt height (10px) - button height (32px).
const sproutButton = cva([
  cls.textPrimaryGreen,
  cls.hoverTextPrimaryGreenDark,
  "absolute top-[30px] right-[34px] z-[11] w-8 h-8 p-0 bg-transparent border-none cursor-pointer flex flex-col items-center transition-colors duration-200",
]);
const panelCard = cva([cls.bgPageBackground, "rounded-[20px] shadow-sm overflow-hidden pb-1.5"]);
const dirtBed = cva([cls.bgToggleActive, "h-2.5"]);
const draftRow = cva("flex items-center h-[46px] pl-3 pr-[86px] mt-[14px]");
const draftInput = cva([
  cls.textPrimaryGreenDark,
  cls.borderBPrimaryGreen,
  "flex-1 min-w-0 bg-transparent border-0 border-b-2 outline-none text-base font-medium py-1 px-0.5",
]);
const list = cva("list-none p-0 m-0 pt-[14px]");
const noPlants = cva(["text-center italic p-5", cls.textMuted]);

// A few darker specks scattered across the dirt strip, plus a darker top edge.
const DIRT_STYLE: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(circle at 6px 4px, color-mix(in oklch, #d8b88b 62%, #1e3f2b) 0 1.2px, transparent 1.2px)",
    "radial-gradient(circle at 23px 7px, color-mix(in oklch, #d8b88b 62%, #1e3f2b) 0 1px, transparent 1px)",
    "radial-gradient(circle at 38px 3px, color-mix(in oklch, #d8b88b 62%, #1e3f2b) 0 1.4px, transparent 1.4px)",
    "radial-gradient(circle at 52px 6px, color-mix(in oklch, #d8b88b 62%, #1e3f2b) 0 1px, transparent 1px)",
  ].join(","),
  backgroundRepeat: "repeat-x",
  backgroundSize: "68px 100%",
  borderTop: "3px solid color-mix(in oklch, #d8b88b 78%, #1e3f2b)",
};

/** Thirst band: 0 = thirsty, 1 = coming up, 2 = settled. */
function thirstBand(daysUntilNextWatering: number | null): number {
  if (daysUntilNextWatering === null) return 2;
  if (daysUntilNextWatering <= 1) return 0;
  if (daysUntilNextWatering <= 3) return 1;
  return 2;
}

/** Sorts thirstiest-first, flagging rows where the thirst band changes so a silent gap can be rendered. */
function sortByThirst(plants: PlantWithStats[]) {
  const sorted = [...plants].sort((a, b) => {
    const daysA = a.daysUntilNextWatering ?? Number.POSITIVE_INFINITY;
    const daysB = b.daysUntilNextWatering ?? Number.POSITIVE_INFINITY;
    return daysA - daysB;
  });
  return sorted.map((plant, i) => ({
    plant,
    gap:
      i > 0 && thirstBand(plant.daysUntilNextWatering) !== thirstBand(sorted[i - 1]!.daysUntilNextWatering),
  }));
}

interface PlantListClientProps {
  plants: PlantWithStats[];
}

export function PlantListClient({ plants }: PlantListClientProps) {
  const { loggedIn } = useSession();
  const router = useRouter();
  const sortedPlants = useMemo(() => sortByThirst(plants), [plants]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const commit = async () => {
    const name = draft.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    setPending(true);
    try {
      await apiClient.api.plants.$post({ json: { name } });
      setDraft("");
      router.reload();
    } finally {
      setPending(false);
    }
  };

  const handleSproutClick = () => {
    if (pending) return;
    if (adding && draft.trim()) {
      commit();
      return;
    }
    setAdding(true);
  };

  return (
    <div className={container()}>
      <div className={panelWrap()}>
        <img src="/shui.png" alt="Shui" className={logoMark()} />
        {loggedIn && (
          <button
            type="button"
            aria-label="Add a new plant"
            onClick={handleSproutClick}
            className={sproutButton()}
          >
            <img src="/pixel-potted-leaf.png" alt="" className="w-8 h-8 [image-rendering:pixelated]" />
          </button>
        )}
        <div className={panelCard()}>
          <div aria-hidden="true" className={dirtBed()} style={DIRT_STYLE} />
          {adding && (
            <div className={draftRow()}>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                onBlur={() => {
                  if (!draft.trim()) setAdding(false);
                }}
                placeholder="Add a new plant"
                disabled={pending}
                className={draftInput()}
              />
            </div>
          )}
          {plants.length > 0 ? (
            <ul className={list()}>
              {sortedPlants.map(({ plant, gap }) => (
                <Plant key={plant.id} plant={plant} gap={gap} />
              ))}
            </ul>
          ) : (
            <p className={noPlants()}>No plants yet. Add your first plant above!</p>
          )}
        </div>
      </div>
    </div>
  );
}
