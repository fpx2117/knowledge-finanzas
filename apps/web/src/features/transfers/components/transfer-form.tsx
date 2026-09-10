"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { getTodayInTimezone } from "@/lib/date";
import { createTransferAction, type TransferActionState } from "../actions/transfer-actions";

const initial: TransferActionState | null = null;

type AccountOption = { id: string; name: string; currencyCode: string };

export function TransferForm({
  accounts,
  timezone,
  cancel,
}: {
  accounts: AccountOption[];
  timezone: string;
  /** Overrides the default "Cancelar" link (e.g. a DialogClose button when shown in a modal). */
  cancel?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(createTransferAction, initial);
  const errors = state?.ok === false ? state.error.fieldErrors ?? {} : {};
  // One idempotency key per form instance (spec 14 §38).
  const [commandId] = useState(() => crypto.randomUUID());

  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const from = accounts.find((a) => a.id === fromId);
  const toOptions = accounts.filter((a) => a.id !== fromId && a.currencyCode === from?.currencyCode);
  const [toId, setToId] = useState(toOptions[0]?.id ?? "");

  const noPair = accounts.length < 2;
  const noSameCurrencyPair = !noPair && toOptions.length === 0;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="commandId" value={commandId} />
      {state?.ok === false ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {state.error.message}
        </p>
      ) : null}

      {noSameCurrencyPair ? (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
          No tenés otra cuenta en {from?.currencyCode}. Las transferencias son entre cuentas de la misma moneda.
        </p>
      ) : null}

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="Desde" htmlFor="fromAccountId" error={errors.fromAccountId?.[0]}>
          <select
            id="fromAccountId"
            name="fromAccountId"
            required
            className={fieldControlClass}
            value={fromId}
            onChange={(event) => {
              setFromId(event.target.value);
              setToId("");
            }}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currencyCode}
              </option>
            ))}
          </select>
        </Field>
        <span aria-hidden className="hidden pb-3 text-muted-foreground sm:block">
          <ArrowRightIcon className="size-5" />
        </span>
        <Field label="Hacia" htmlFor="toAccountId" error={errors.toAccountId?.[0]}>
          <select
            id="toAccountId"
            name="toAccountId"
            required
            className={fieldControlClass}
            value={toId}
            onChange={(event) => setToId(event.target.value)}
          >
            {toOptions.length === 0 ? <option value="">—</option> : null}
            {toOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currencyCode}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Monto" htmlFor="amount" error={errors.amount?.[0]}>
          <input id="amount" name="amount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
        </Field>
        <Field label="Fecha" htmlFor="occurredAt" error={errors.occurredAt?.[0]}>
          <input id="occurredAt" name="occurredAt" type="date" required defaultValue={getTodayInTimezone(timezone)} className={fieldControlClass} />
        </Field>
      </div>

      <Field label="Notas" htmlFor="notes" help="Opcional." error={errors.notes?.[0]}>
        <input id="notes" name="notes" type="text" maxLength={1000} placeholder="Ej. Reserva para gastos fijos" className={fieldControlClass} />
      </Field>

      <p className="text-caption text-muted-foreground">
        Una transferencia mueve dinero entre tus cuentas. No cuenta como ingreso ni como gasto.
      </p>

      <div className="flex items-center justify-end gap-3 pt-2">
        {cancel ?? <Button variant="outline" render={<Link href="/transactions">Cancelar</Link>} />}
        <Button type="submit" disabled={pending || noPair || noSameCurrencyPair}>
          {pending ? "Transfiriendo…" : "Transferir"}
        </Button>
      </div>
    </form>
  );
}
