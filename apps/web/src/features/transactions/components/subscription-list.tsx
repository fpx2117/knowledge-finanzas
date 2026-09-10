"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowUpRightIcon, PlusIcon, RefreshCwIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { usePaginated } from "@/components/shared/use-paginated";
import { ShowMoreButton } from "@/components/shared/show-more-button";
import { MerchantLogo } from "@/components/financial/merchant-logo";
import { getTodayInTimezone } from "@/lib/date";
import { createSubscriptionAction, dismissSubscriptionAction, scanSubscriptionsAction } from "../actions/subscription-detection-actions";
import type { SubscriptionView } from "../services/subscription-detection-service";

type SubscriptionRow = SubscriptionView & { merchantName?: string; merchantDomain?: string | null };

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

export function NewSubscriptionButton({ timezone }: { timezone: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createSubscriptionAction, null);
  const fieldErrors = state?.ok === false ? state.error.fieldErrors ?? {} : {};

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PlusIcon className="size-4" /> Nueva suscripción
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva suscripción</DialogTitle>
          <DialogDescription>Un cargo que se repite todos los meses o años.</DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          {state?.ok === false ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
              {state.error.message}
            </p>
          ) : null}
          <Field label="Comercio / servicio" htmlFor="merchantName" error={fieldErrors.merchantName?.[0]}>
            <input id="merchantName" name="merchantName" type="text" required placeholder="Ej. ChatGPT, Netflix" className={fieldControlClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto" htmlFor="amount" error={fieldErrors.amount?.[0]}>
              <input id="amount" name="amount" type="text" inputMode="decimal" required placeholder="0,00" className={fieldControlClass} />
            </Field>
            <Field label="Moneda" htmlFor="currencyCode">
              <select id="currencyCode" name="currencyCode" defaultValue="ARS" required className={fieldControlClass}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Frecuencia" htmlFor="frequency">
              <select id="frequency" name="frequency" defaultValue="MONTHLY" required className={fieldControlClass}>
                <option value="MONTHLY">Mensual</option>
                <option value="YEARLY">Anual</option>
              </select>
            </Field>
            <Field label="Próximo cargo" htmlFor="nextChargeOn" error={fieldErrors.nextChargeOn?.[0]}>
              <input id="nextChargeOn" name="nextChargeOn" type="date" required defaultValue={getTodayInTimezone(timezone)} className={fieldControlClass} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionList({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { visible, remaining, showMore } = usePaginated(subscriptions, 20);

  return (
    <>
    <ul className="flex flex-col divide-y divide-border">
      {visible.map((s) => (
        <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <MerchantLogo name={s.merchantName ?? s.label} domain={s.merchantDomain} className="mt-0.5 size-8" />
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
