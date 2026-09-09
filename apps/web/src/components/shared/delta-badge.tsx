import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import type { Delta } from "@/features/reports/services/report-service";
import { cn } from "@/lib/utils";

// spec 08 §15 — variación vs. período comparable. §15.4: comparativo = 0 → "Sin base comparable"
// (no "+∞%"). §15.5: no depender del color ni imponer juicio — icono + texto, tono calmo.
export function DeltaBadge({ delta, comparedToLabel, className }: { delta: Delta; comparedToLabel: string; className?: string }) {
  const n = Number(delta.value);
  const Icon = n > 0 ? ArrowUpRightIcon : n < 0 ? ArrowDownRightIcon : MinusIcon;

  return (
    <span className={cn("inline-flex items-center gap-1 text-caption text-muted-foreground", className)}>
      <Icon aria-hidden className="size-3" />
      {delta.pct === null ? (
        <span>Sin base comparable</span>
      ) : (
        <span className="tabular-nums">
          {delta.pct > 0 ? "+" : ""}
          {delta.pct}% vs. {comparedToLabel}
        </span>
      )}
    </span>
  );
}
