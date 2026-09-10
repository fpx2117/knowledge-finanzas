"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Maximize2Icon, XIcon } from "lucide-react";

/**
 * A small "expand" button that opens the given chart at a larger size in a modal with a blurred
 * backdrop. Used by the Resumen chart cards ("Flujo del mes", "Gastos por categoría").
 */
export function ChartExpand({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label={`Ampliar “${title}”`}
        className="relative grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors after:absolute after:-inset-1 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <Maximize2Icon className="size-4" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[var(--z-modal)] bg-[rgb(16_24_47_/_0.45)] backdrop-blur-md duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-[var(--z-modal)] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-floating)] outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <DialogPrimitive.Title className="text-h3 text-foreground">{title}</DialogPrimitive.Title>
              {subtitle ? (
                <DialogPrimitive.Description className="text-caption text-muted-foreground">{subtitle}</DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              <XIcon className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="min-w-0">{children}</div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
