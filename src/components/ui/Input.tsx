import { cva } from "class-variance-authority";
import * as React from "react";
import { twMerge } from "tailwind-merge";
import { cls } from "../../styles/palette.ts";

const inputVariants = cva([
  "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
  "placeholder:text-gray-400",
  "focus-visible:outline-none",
  cls.borderInput,
  cls.focusBorderPrimaryGreen,
  cls.focusShadowPrimaryGreen,
  "disabled:cursor-not-allowed disabled:opacity-50",
]);

export interface InputProps extends React.ComponentProps<"input"> {
  className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} className={twMerge(inputVariants(), className)} ref={ref} {...props} />;
});

Input.displayName = "Input";

export { Input };
