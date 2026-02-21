"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[#d8b88b] data-[state=on]:text-white hover:bg-[#f5e9d8] focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-[#d8b88b] bg-transparent hover:bg-[#f5e9d8]",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<React.ComponentRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root ref={ref} className={toggleVariants({ variant, size, className })} {...props} />
  ),
);

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
