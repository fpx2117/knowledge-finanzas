import Link from "next/link";

import type { ChipTone } from "@/components/shared/status-chip";
import type { DerivedObligation, ObligationStatus, ObligationType } from "@know-finanzas/finance";
import { cn } from "@/lib/utils";

export const OBLIGATION_STATUS_META: Record<
  ObligationStatus,
  { label: string; tone: ChipTone }
> = {
  OVERDUE: { label: "Vencida", tone: "negative" },
  DUE_TODAY: { label: "Vence hoy", tone: "warning" },
  DUE_SOON: { label: "Vence pronto", tone: "warning" },
  PARTIALLY_PAID: { label: "Pago parcial", tone: "info" },
  UPCOMING: { label: "Próxima", tone: "neutral" },
};

export const OBLIGATION_TYPE_LABEL: Record<ObligationType, string> = {
  DEBT: "Deuda",
  INSTALLMENT_PLAN: "Cuota",
  SUBSCRIPTION: "Suscripción",
  RECURRING_BILL: "Servicio recurrente",
  ONE_TIME: "Programado",
  OTHER: "Otra",
};

export const OBLIGATION_HORIZONS = [7, 15, 30, 60, 90] as const;

/** spec 05 §10.2 — horizon selector. Default 30. Preserves nothing else (this view has no other state). */
export function HorizonSelector({
  active,
  basePath = "/obligations/upcoming",
}: {
  active: number;
  basePath?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Horizonte"
      className="inline-flex rounded-lg border border-border bg-surface-secondary p-0.5"
    >
      {OBLIGATION_HORIZONS.map((days) => {
        const isActive = days === active;
        return (
          <Link
            key={days}
            href={days === 30 ? basePath : `${basePath}?horizon=${days}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-small font-medium transition-colors",
              isActive
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {days} días
          </Link>
        );
      })}
    </div>
  );
}

export function parseHorizon(raw: string | undefined): number {
  const value = Number(raw);
  return (OBLIGATION_HORIZONS as readonly number[]).includes(value)
    ? value
    : 30;
}

function addDaysISO(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export type ObligationGroup = { key: string; label: string; items: DerivedObligation[] };

/**
 * spec 05 §9.5 — the main list is grouped by *time*, not by type, because the
 * point of the view is to anticipate. Empty groups are dropped.
 */
export function groupObligationsTemporally(items: readonly DerivedObligation[], today: string): ObligationGroup[] {
  const in7 = addDaysISO(today, 7);
  const endOfMonth = `${today.slice(0, 7)}-${String(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)).getUTCDate()).padStart(2, "0")}`;

  const groups: ObligationGroup[] = [
    { key: "overdue", label: "Vencidas", items: [] },
    { key: "today", label: "Hoy", items: [] },
    { key: "next7", label: "Próximos 7 días", items: [] },
    { key: "month", label: "Este mes", items: [] },
    { key: "later", label: "Más adelante", items: [] },
  ];

  for (const item of items) {
    if (item.dueDate < today) groups[0].items.push(item);
    else if (item.dueDate === today) groups[1].items.push(item);
    else if (item.dueDate <= in7) groups[2].items.push(item);
    else if (item.dueDate <= endOfMonth) groups[3].items.push(item);
    else groups[4].items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}
