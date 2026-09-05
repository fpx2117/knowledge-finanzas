import Link from "next/link";

import type { ChipTone } from "@/components/shared/status-chip";
import type { ObligationStatus, ObligationType } from "@know-finanzas/finance";
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
