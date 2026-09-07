"use client";

import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { openCommandPalette } from "./command-palette-root";

// Spec 13 §9.2 — the "buscar" affordance in the app header. Opens the command palette (§15),
// which is also reachable by ⌘K / Ctrl+K.
export function CommandPaletteTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openCommandPalette()}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-small text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <SearchIcon aria-hidden="true" className="size-4" />
      <span>Buscar</span>
      <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 font-sans text-[0.7rem] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
