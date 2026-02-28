"use client";

import { cva } from "class-variance-authority";
import type * as React from "react";

const buttonGroupVariants = cva([
  "flex flex-row",
  "[&>*]:rounded-none",
  "[&>*:first-child]:rounded-l-md",
  "[&>*:last-child]:rounded-r-md",
  "[&>*:not(:first-child)]:-ml-px",
  "[&>*]:relative",
  "[&>*:hover]:z-10",
  "[&>*:focus-within]:z-10",
]);

function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={buttonGroupVariants({ class: className })} {...props} />;
}

export { ButtonGroup };
