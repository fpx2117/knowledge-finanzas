import { ArrowDownIcon, ArrowUpIcon, FlagIcon } from "lucide-react";

import { MoneyAmount } from "@/components/financial/money-amount";
import { formatLongDate } from "@/lib/format";
import type { GoalAllocationKind } from "@know-finanzas/db";

export type GoalAllocationView = {
  id: string;
  kind: GoalAllocationKind;
  amount: string;
  currencyCode: string;
  occurredOn: string;
  note: string | null;
};

const KIND_META: Record<GoalAllocationKind, { label: string; icon: typeof ArrowUpIcon; sign: "+" | "-" }> = {
  INITIAL: { label: "Progreso inicial", icon: FlagIcon, sign: "+" },
  CONTRIBUTION: { label: "Aporte", icon: ArrowUpIcon, sign: "+" },
  WITHDRAWAL: { label: "Retiro", icon: ArrowDownIcon, sign: "-" },
};

// spec 07 §14.2 — historial de aportes. A read-only ledger of the goal's allocations; it never
// implies a movement in the user's accounts.
export function GoalHistory({ allocations }: { allocations: GoalAllocationView[] }) {
  if (allocations.length === 0) {
    return <p className="py-6 text-center text-small text-muted-foreground">Todavía no registraste aportes en esta meta.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {allocations.map((allocation) => {
        const meta = KIND_META[allocation.kind];
        const Icon = meta.icon;
        return (
          <li key={allocation.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className={
                  meta.sign === "-"
                    ? "flex size-8 shrink-0 items-center justify-center rounded-md bg-warning-soft text-[var(--warning)]"
                    : "flex size-8 shrink-0 items-center justify-center rounded-md bg-success-soft text-[var(--success)]"
                }
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-small font-medium text-foreground">
                  {meta.label}
                  {allocation.note ? <span className="font-normal text-muted-foreground"> · {allocation.note}</span> : null}
                </span>
                <span className="text-caption text-muted-foreground">{formatLongDate(allocation.occurredOn)}</span>
              </span>
            </span>
            <MoneyAmount
              amount={`${meta.sign}${allocation.amount}`}
              currency={allocation.currencyCode}
              variant="compact"
              sign="always"
              tone={meta.sign === "-" ? "neutral" : "positive"}
              className="shrink-0 text-small font-medium"
            />
          </li>
        );
      })}
    </ul>
  );
}
