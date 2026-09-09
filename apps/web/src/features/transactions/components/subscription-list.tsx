"use client";

import { useState, useTransition } from "react";
import { ArrowUpRightIcon, RefreshCwIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePaginated } from "@/components/shared/use-paginated";
import { ShowMoreButton } from "@/components/shared/show-more-button";
import { dismissSubscriptionAction, scanSubscriptionsAction } from "../actions/subscription-detection-actions";
import type { SubscriptionView } from "../services/subscription-detection-service";

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: "semanal",
  BIWEEKLY: "quincenal",
  MONTHLY: "mensual",
  QUARTERLY: "trimestral",
  YEARLY: "anual",
};

function money(amount: string | number, currency: string) {
  const n = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
    : `${currency} ${amount}`;
}

export function SubscriptionScanButton({ hasAny }: { hasAny: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={hasAny ? "outline" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await scanSubscriptionsAction();
            setMessage(
              result.ok
                ? result.found === 0
                  ? "No detectamos suscripciones nuevas."
                  : `${result.found} ${result.found === 1 ? "suscripción detectada" : "suscripciones detectadas"}.`
                : result.error.message,
            );
          })
        }
      >
        <RefreshCwIcon className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Buscando…" : "Buscar suscripciones"}
      </Button>
      {message ? <span className="text-caption text-muted-foreground">{message}</span> : null}
    </div>
  );
}

export function SubscriptionList({ subscriptions }: { subscriptions: SubscriptionView[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { visible, remaining, showMore } = usePaginated(subscriptions, 20);

  return (
    <>
    <ul className="flex flex-col divide-y divide-border">
      {visible.map((s) => (
        <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-small font-medium text-foreground">
              {s.label} · {money(s.currentAmount, s.currencyCode)} {FREQUENCY_LABEL[s.frequency] ?? s.frequency.toLowerCase()}
              {s.status === "INACTIVE" ? <span className="ml-2 text-caption text-muted-foreground">(sin cargos recientes)</span> : null}
            </p>
            <p className="text-caption text-muted-foreground">
              {s.chargeCount} cargos{s.categoryName ? ` · ${s.categoryName}` : ""} · próximo aprox. {s.nextExpectedOn}
            </p>
            {s.priceChange ? (
              <p className="mt-1 inline-flex items-center gap-1 text-caption text-[var(--warning)]">
                <ArrowUpRightIcon className="size-3.5" />
                Subió de {money(s.priceChange.from, s.currencyCode)} a {money(s.priceChange.to, s.currencyCode)} ·{" "}
                {s.priceChange.yearlyImpact >= 0 ? "+" : ""}
                {money(s.priceChange.yearlyImpact, s.currencyCode)}/año
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={`No es una suscripción: ${s.label}`}
            disabled={pendingId === s.id}
            onClick={() =>
              startTransition(async () => {
                setPendingId(s.id);
                await dismissSubscriptionAction(s.id);
                setPendingId(null);
              })
            }
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <XIcon className="size-4" />
          </button>
        </li>
      ))}
    </ul>
    <ShowMoreButton remaining={remaining} onClick={showMore} />
    </>
  );
}
