"use client";

import { useActionState, useState } from "react";
import { ArchiveIcon } from "lucide-react";

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
import { MoneyAmount } from "@/components/financial/money-amount";
import { archiveAccountAction, type ArchiveAccountState } from "../actions/archive-account";

const initialState: ArchiveAccountState | null = null;

// OQ-007 (spec 05-mvp-roadmap / 14-dashboard-cashflow-slice): archiving a non-zero-balance
// account is allowed — it doesn't destroy or move money, transactions/history stay intact — but
// the user must see, before confirming, that this balance is about to drop out of their totals.
export function AccountActions({
  accountId,
  accountName,
  balance,
  currencyCode,
}: {
  accountId: string;
  accountName: string;
  balance: string;
  currencyCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(archiveAccountAction, initialState);
  const hasBalance = Number(balance) !== 0;

  if (state?.ok) {
    // The action revalidates /accounts/[id]; close on success.
    if (open) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <ArchiveIcon className="size-4" /> Archivar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivar {accountName}</DialogTitle>
          <DialogDescription>
            La cuenta deja de aparecer en tus totales y no admite nuevos movimientos. Sus movimientos históricos se conservan.
          </DialogDescription>
        </DialogHeader>
        {hasBalance ? (
          <p role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
            Esta cuenta todavía tiene saldo:{" "}
            <MoneyAmount amount={balance} currency={currencyCode} variant="compact" className="font-medium" />. Al
            archivarla, ese saldo deja de sumar en tu saldo total y en el dinero disponible — el movimiento no se
            borra, sólo se excluye de las cuentas activas.
          </p>
        ) : null}
        {state?.ok === false ? (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
            {state.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <form action={action}>
            <input type="hidden" name="accountId" value={accountId} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Archivando…" : "Archivar cuenta"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
