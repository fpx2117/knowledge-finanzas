"use client";

import { Button } from "@/components/ui/button";
import { openQuickAdd } from "./quick-add-root";

/** A page-level "Registrar" CTA that opens the global Quick Add flow (spec 01 §7.2 / spec 13 §7). */
export function QuickAddButton({ children = "Registrar" }: { children?: React.ReactNode }) {
  return (
    <Button type="button" onClick={() => openQuickAdd()}>
      {children}
    </Button>
  );
}
