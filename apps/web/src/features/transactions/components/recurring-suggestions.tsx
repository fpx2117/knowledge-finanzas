"use client";

import { useState, useTransition } from "react";
import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePaginated } from "@/components/shared/use-paginated";
import { ShowMoreButton } from "@/components/shared/show-more-button";
import { confirmRecurringAction, dismissRecurringAction, scanRecurringAction } from "../actions/recurring-detection-actions";
import type { RecurringSuggestionView } from "../services/recurring-detection-service";

const FREQUENCY_LABEL: Record<RecurringSuggestionView["frequency"], string> = {
  WEEKLY: "semanal",
  BIWEEKLY: "quincenal",
  MONTHLY: "mensual",
  QUARTERLY: "trimestral",
  YEARLY: "anual",
};

function money(amount: string, currency: string) {
  const n = Number(amount);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
    : `${currency} ${amount}`;
}

export function RecurringScanButton({ hasSuggestions }: { hasSuggestions: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={hasSuggestions ? "outline" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await scanRecurringAction();
            setMessage(
              result.ok
                ? result.found === 0
                  ? "No encontramos patrones recurrentes nuevos."
                  : `Encontramos ${result.found} ${result.found === 1 ? "patrón" : "patrones"}.`
                : result.error.message,
            );
          })
        }
      >
        <RefreshCwIcon className={pending ? "size-4 animate-spin" : "size-4"} />
        {pending ? "Buscando…" : "Buscar recurrentes"}
      </Button>
      {message ? <span className="text-caption text-muted-foreground">{message}</span> : null}
    </div>
  );
}

export function RecurringSuggestionList({ suggestions }: { suggestions: RecurringSuggestionView[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { visible, remaining, showMore } = usePaginated(suggestions, 20);

  const act = (id: string, fn: (id: string) => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      setPendingId(id);
      await fn(id);
      setPendingId(null);
    });

  return (
    <>
    <ul className="flex flex-col divide-y divide-border">
      {visible.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-small font-medium text-foreground">
              {s.label} · {money(s.typicalAmount, s.currencyCode)} {FREQUENCY_LABEL[s.frequency]}
            </p>
            <p className="text-caption text-muted-foreground">
              {s.occurrenceCount} veces{s.categoryName ? ` · ${s.categoryName}` : ""} · próximo aprox. {s.nextExpectedOn}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              disabled={pendingId === s.id}
              onClick={() => act(s.id, confirmRecurringAction)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-caption font-medium hover:bg-muted disabled:opacity-50"
            >
              <CheckIcon className="size-3.5" /> Es recurrente
            </button>
            <button
              type="button"
              aria-label={`Descartar ${s.label}`}
              disabled={pendingId === s.id}
              onClick={() => act(s.id, dismissRecurringAction)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
    <ShowMoreButton remaining={remaining} onClick={showMore} />
    </>
  );
}
