"use client";

import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Toast host. Financial errors must stay explicit and recoverable
// (visual-design-personal.md §23) — toasts are for confirmations and
// transient status, never the only signal for a failed money operation.
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      style={{ zIndex: "var(--z-toast)" } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-md group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
