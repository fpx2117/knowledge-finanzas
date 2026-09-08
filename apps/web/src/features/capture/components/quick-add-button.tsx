"use client";

import { Button } from "@/components/ui/button";
import { openQuickAdd } from "./quick-add-root";

/**
 * A page-level "Registrar" CTA that opens the global Quick Add flow (spec 01 §7.2 / spec 13 §7).
 * `type` preselects Gasto/Ingreso in the dialog (spec 03 §10.6 / §11).
 */
export function QuickAddButton({
  children = "Registrar",
  type,
}: {
  children?: React.ReactNode;
  type?: "EXPENSE" | "INCOME";
}) {
  return (
    <Button
      type="button"
      onClick={() =>
        openQuickAdd(type ? { type, amount: "", description: "", merchant: null, categoryId: null, accountId: null } : undefined)
      }
    >
      {children}
    </Button>
  );
}
