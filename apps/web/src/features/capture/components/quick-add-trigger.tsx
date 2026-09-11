"use client";

import { FinanceIcon } from "@/design-system/icons";
import { cn } from "@/lib/utils";
import { openQuickAdd } from "./quick-add-root";

/**
 * A button that opens the global Quick Add. `sidebar` is the persistent primary
 * action; `mobile` is the compact top-bar version.
 */
export function QuickAddTrigger({ variant = "sidebar", className }: { variant?: "sidebar" | "mobile"; className?: string }) {
  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={() => openQuickAdd()}
        aria-label="Registrar movimiento"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-lg bg-brand text-white transition-[background-color,scale] hover:bg-brand-hover active:scale-[0.96]",
          className,
        )}
      >
        <FinanceIcon name="add" size="md" className="text-current" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-lg bg-brand px-3 text-body font-medium text-white transition-[background-color,scale] hover:bg-brand-hover active:scale-[0.98]",
        className,
      )}
    >
      <FinanceIcon name="add" size="sm" className="text-current" />
      Registrar
      <kbd className="ml-auto rounded border border-white/30 px-1.5 text-caption font-sans text-white/80">N</kbd>
    </button>
  );
}
