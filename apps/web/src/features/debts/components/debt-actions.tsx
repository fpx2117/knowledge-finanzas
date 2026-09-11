"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowDownIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyAmount } from "@/components/financial/money-amount";
import { cancelDebtAction, recordPaymentAction, type DebtActionState } from "../actions/debt-actions";

const initial: DebtActionState | null = null;

type AccountOption = { id: string; name: string; currencyCode: string };

export function DebtActions({
  debtId,
  currencyCode,
  remainingAmount,
  accounts,
}: {
  debtId: string;
  currencyCode: string;
  remainingAmount: string;
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  // Idempotency key (spec 14 §38): refreshed each time the dialog opens, so a timed-out
  // submit that the user retries never applies the same payment twice.
  const [commandId, setCommandId] = useState(() => crypto.randomUUID());
  const [payState, payAction, payPending] = useActionState(recordPaymentAction, initial);

  if (payState?.ok && payOpen) {
    setPayOpen(false);
    router.refresh();
    window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
  }
  const payErrors = payState?.ok === false ? payState.error.fieldErrors ?? {} : {};
  const eligibleAccounts = accounts.filter((account) => account.currencyCode === currencyCode);

  return (
    <div className="flex gap-2">
      <Dialog
        open={payOpen}
        onOpenChange={(next) => {
          if (next) setCommandId(crypto.randomUUID());
          setPayOpen(next);
        }}
      >
        <DialogTrigger
          render={
            <Button>
              <BanknoteArrowDownIcon className="size-4" /> Registrar pago
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar un pago</DialogTitle>
            <DialogDescription>
              Se descuenta de la cuenta elegida y se aplica a las cuotas más antiguas primero. Pendiente:{" "}
              <MoneyAmount amount={remainingAmount} currency={currencyCode} variant="compact" />.
            </DialogDescription>
          </DialogHeader>
          <form action={payAction} className="flex flex-col gap-4">
            <input type="hidden" name="debtId" value={debtId} />
            <input type="hidden" name="commandId" value={commandId} />
            {payState?.ok === false ? (
              <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                {payState.error.message}
              </p>
            ) : null}
            {eligibleAccounts.length === 0 ? (
              <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
                Necesitás una cuenta en {currencyCode} para registrar el pago.
              </p>
            ) : null}
            <Field label="Cuenta" htmlFor="accountId" error={payErrors.accountId?.[0]}>
              <select id="accountId" name="accountId" required className={fieldControlClass} defaultValue={eligibleAccounts[0]?.id}>
                {eligibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Monto" htmlFor="amount" error={payErrors.amount?.[0]}>
              <input id="amount" name="amount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={payPending || eligibleAccounts.length === 0}>
                {payPending ? "Registrando…" : "Registrar pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        trigger={<Button variant="outline"><XIcon className="size-4" /> Cancelar obligación</Button>}
        title="Cancelar esta obligación"
        description="Las cuotas no pagadas quedan canceladas. Los pagos ya registrados se conservan."
        confirmLabel="Cancelar obligación"
        pendingLabel="Cancelando…"
        cancelLabel="Volver"
        action={cancelDebtAction}
        hiddenFields={{ debtId }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
