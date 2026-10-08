"use client";

import { cva } from "class-variance-authority";
import * as React from "react";
import { twMerge } from "tailwind-merge";
import { cls } from "../../styles/palette.ts";

const ITEM_HEIGHT = 24;

const wheel = cva([
  "relative h-9 w-12 shrink-0 overflow-y-auto overscroll-contain snap-y snap-mandatory rounded-md border bg-transparent py-1.5 text-sm",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  "[mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]",
  "focus-visible:outline-none",
  cls.borderInput,
  cls.focusBorderPrimaryGreen,
  cls.focusShadowPrimaryGreen,
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
]);
const wheelItem = cva("flex h-6 snap-center items-center justify-center", {
  variants: {
    selected: {
      true: ["font-semibold", cls.textPrimaryGreen],
      false: "text-gray-400",
    },
  },
});

export interface WheelSelectProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function WheelSelect({
  value,
  onChange,
  min = 1,
  max = 7,
  disabled,
  className,
  ...props
}: WheelSelectProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // Sync the scroll position to the value on mount, reset and keyboard changes. Skipped when
  // the wheel already points at the value so a user's in-flight scroll isn't snapped back.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM_HEIGHT) !== value - min)
      el.scrollTop = (value - min) * ITEM_HEIGHT;
  }, [value, min]);

  return (
    <div
      ref={ref}
      role="listbox"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-orientation="vertical"
      className={twMerge(wheel(), disabled && "overflow-hidden", className)}
      onScroll={(e) => {
        if (disabled) return;
        const index = Math.round(e.currentTarget.scrollTop / ITEM_HEIGHT);
        const next = Math.min(max, Math.max(min, min + index));
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        const delta = { ArrowUp: -1, ArrowDown: 1, PageUp: -7, PageDown: 7 }[e.key];
        if (delta !== undefined) {
          e.preventDefault();
          onChange(Math.min(max, Math.max(min, value + delta)));
        }
      }}
      {...props}
    >
      {options.map((n) => (
        <div
          key={n}
          role="option"
          tabIndex={-1}
          aria-selected={n === value}
          className={wheelItem({ selected: n === value })}
        >
          {n}
        </div>
      ))}
    </div>
  );
}
