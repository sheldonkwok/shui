"use client";

import { cva } from "class-variance-authority";
import { House, Trees } from "lucide-react";
import { cls } from "../styles/palette.ts";
import type { PlantLocation } from "../types.ts";

// Mirrors the sprout button on the dirt strip's left edge (top = 52 + 10 - 28).
const group = cva("absolute top-[34px] left-[28px] z-[11] flex rounded-md overflow-hidden shadow-sm");
const option = cva(
  "w-8 h-7 flex items-center justify-center border-none cursor-pointer transition-colors duration-200",
  {
    variants: {
      active: {
        true: [cls.bgPrimaryGreen, "text-white"],
        false: [cls.bgPageBackground, cls.textPrimaryGreen, cls.hoverBgHover],
      },
    },
  },
);

const OPTIONS = [
  { value: "indoor", label: "Indoor plants", Icon: House },
  { value: "outdoor", label: "Outdoor garden", Icon: Trees },
] as const;

interface LocationToggleProps {
  value: PlantLocation;
  onChange: (value: PlantLocation) => void;
}

export function LocationToggle({ value, onChange }: LocationToggleProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a pair of toggle buttons, not a form fieldset
    <div className={group()} role="group" aria-label="Plant location">
      {OPTIONS.map(({ value: optionValue, label, Icon }) => (
        <button
          key={optionValue}
          type="button"
          aria-label={label}
          aria-pressed={value === optionValue}
          onClick={() => onChange(optionValue)}
          className={option({ active: value === optionValue })}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
