import { ArrowDownRightIcon, ArrowUpRightIcon, InfoIcon, MinusIcon, type LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { cn } from "@/lib/utils";

type Tone = "brand" | "positive" | "negative" | "warning";

const TILE: Record<Tone, string> = {
  brand: "bg-brand-subtle text-brand",
  positive: "bg-success-soft text-[var(--success)]",
  negative: "bg-negative-soft text-[var(--negative)]",
  warning: "bg-warning-soft text-[var(--warning)]",
};

export type KpiDelta = { pct: number; comparedTo: string } | null;

/**
 * Resumen KPI card — matches the reference mock: a colored icon tile on the left, the label
 * with an optional info tooltip, the dominant amount, and a delta / hint line underneath.
 */
export function KpiCard({
  label,
  icon: Icon,
  iconNode,
  tone,
  value,
  currency,
  display,
  info,
  delta,
  hint,
}: {
  label: string;
  icon?: LucideIcon;
  /** A self-contained mark (flag, logo) shown instead of the tinted lucide tile. */
  iconNode?: React.ReactNode;
  tone: Tone;
  /** Money value — rendered as a MoneyAmount. Ignored when `display` is set. */
  value?: string;
  currency?: string;
  /** A non-money value (e.g. "Hoy · 18:42", "4"). Takes precedence over `value`. */
  display?: React.ReactNode;
  info?: string;
  delta?: KpiDelta;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:gap-3.5 sm:p-5">
      {iconNode ? (
        <span className="shrink-0 [&>*]:size-9 [&>*]:rounded-xl sm:[&>*]:size-10">{iconNode}</span>
      ) : Icon ? (
        <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-xl sm:size-10", TILE[tone])}>
          <Icon className="size-[17px] sm:size-[18px]" />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-0.5 sm:gap-1">
        <span className="flex items-center gap-1 text-caption font-medium text-muted-foreground">
          <span className="truncate">{label}</span>
          {info ? (
            <Tooltip>
              <TooltipTrigger aria-label={`Qué significa: ${label}`} className="shrink-0 text-muted-foreground/70 hover:text-foreground">
                <InfoIcon className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{info}</TooltipContent>
            </Tooltip>
          ) : null}
        </span>
        {display !== undefined ? (
          <span className="text-[1.15rem] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-metric">{display}</span>
        ) : (
          <MoneyAmount
            amount={value ?? "0"}
            currency={currency ?? "ARS"}
            variant="compact"
            className="text-[1.15rem] font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-metric"
          />
        )}
        {delta ? <DeltaLine delta={delta} /> : hint ? <span className="truncate text-caption text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

function DeltaLine({ delta }: { delta: NonNullable<KpiDelta> }) {
  const up = delta.pct > 0;
  const down = delta.pct < 0;
  const Icon = up ? ArrowUpRightIcon : down ? ArrowDownRightIcon : MinusIcon;
  const color = up ? "text-[var(--success)]" : down ? "text-[var(--negative)]" : "text-muted-foreground";
  const fmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
  return (
    <span className={cn("flex items-center gap-1 text-caption tabular-nums", color)}>
      <Icon aria-hidden className="size-3" />
      {up ? "+" : ""}
      {fmt.format(delta.pct)}%
      <span className="text-muted-foreground"> vs. {delta.comparedTo}</span>
    </span>
  );
}
