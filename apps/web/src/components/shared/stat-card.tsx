import { InfoIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { cn } from "@/lib/utils";

type StatTone = "neutral" | "positive" | "negative" | "warning";

const ICON_TONE: Record<StatTone, string> = {
  neutral: "bg-brand-subtle text-brand",
  positive: "bg-success-soft text-[var(--success)]",
  negative: "bg-negative-soft text-[var(--negative)]",
  warning: "bg-warning-soft text-[var(--warning)]",
};

/**
 * KPI card — visual-design-personal.md §11. The metric value is visually
 * dominant over its label (§24); a supporting line explains what it means
 * (§2.3). Never render projected data here without labelling it (§11).
 */
export function StatCard({
  label,
  info,
  icon: Icon,
  tone = "neutral",
  hint,
  children,
  value,
  currency,
}: {
  label: string;
  info?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: string;
  /** Either pass `value`+`currency` for a money metric, or `children` for anything else. */
  value?: string;
  currency?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            {info ? (
              <Tooltip>
                <TooltipTrigger aria-label={`Qué significa: ${label}`} className="text-muted-foreground hover:text-foreground">
                  <InfoIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">{info}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {Icon ? (
            <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", ICON_TONE[tone])}>
              <Icon className="size-4" />
            </span>
          ) : null}
        </div>

        <div className="text-metric font-medium text-foreground">
          {value !== undefined && currency ? (
            <MoneyAmount amount={value} currency={currency} variant="compact" tone="neutral" className="text-metric" />
          ) : (
            children
          )}
        </div>

        {hint ? <p className="text-small text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
