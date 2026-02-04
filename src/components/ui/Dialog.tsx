"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { css, cx } from "../../../styled-system/css";

const overlayStyles = css({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 50,
});

const contentStyles = css({
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "white",
  borderRadius: "8px",
  padding: "24px",
  boxShadow: "0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)",
  zIndex: 50,
  maxWidth: "450px",
  width: "90vw",
});

const closeButtonStyles = css({
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px",
  borderRadius: "4px",
  color: "#666",
  _hover: {
    backgroundColor: "#f0f0f0",
  },
});

const titleStyles = css({
  fontSize: "1.125rem",
  fontWeight: 600,
  marginBottom: "8px",
});

const descriptionStyles = css({
  fontSize: "0.875rem",
  color: "#666",
  marginBottom: "16px",
});

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayStyles} />
      <DialogPrimitive.Content className={contentStyles} {...props}>
        {children}
        <DialogPrimitive.Close className={closeButtonStyles}>
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({
  children,
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return (
    <DialogPrimitive.Title className={cx(titleStyles, className)} {...props}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  children,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description className={descriptionStyles} {...props}>
      {children}
    </DialogPrimitive.Description>
  );
}
