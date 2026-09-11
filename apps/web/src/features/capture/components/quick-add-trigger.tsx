"use client";

import { cn } from "@/lib/utils";
import { openQuickAdd } from "./quick-add-root";

// El ícono es KAI en su versión "registrar" (badge circular propio, con flechas de
// ingreso/gasto) — reemplaza al "+" genérico en el botón que abre el Quick Add.
const KAI_REGISTER_SRC = "/brand/kai/kai-register.png";

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
          "inline-flex size-10 items-center justify-center rounded-full transition-transform active:scale-[0.96]",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset, no next/image optimizer */}
        <img src={KAI_REGISTER_SRC} alt="" draggable={false} className="size-9 object-contain" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-lg bg-brand pr-3 pl-1.5 text-body font-medium text-white transition-[background-color,scale] hover:bg-brand-hover active:scale-[0.98]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand asset, no next/image optimizer */}
      <img src={KAI_REGISTER_SRC} alt="" draggable={false} className="size-7 shrink-0 object-contain" />
      Registrar
      <kbd className="ml-auto rounded border border-white/30 px-1.5 text-caption font-sans text-white/80">N</kbd>
    </button>
  );
}
