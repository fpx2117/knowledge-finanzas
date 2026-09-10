"use client";

import { useActionState } from "react";
import { ArchiveIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyAmount } from "@/components/financial/money-amount";
import { archiveAccountAction } from "../actions/archive-account";
import { setPrimaryAccountAction } from "../actions/set-primary-account";

// OQ-007: archiving a non-zero-balance account is allowed — it doesn't destroy or move money,
// transactions/history stay intact — but the user must see, before confirming, that this balance
// is about to drop out of their totals (spec 13 §22.1 "consecuencia clara").
export function AccountActions({
  accountId,
  accountName,
  balance,
  currencyCode,
  isPrimary = false,
}: {
  accountId: string;
  accountName: string;
  balance: string;
  currencyCode: string;
  isPrimary?: boolean;
}) {
  const hasBalance = Number(balance) !== 0;
  const [, setPrimary, settingPrimary] = useActionState(setPrimaryAccountAction, null);

  return (
    <>
      {isPrimary ? (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-subtle px-2.5 py-1.5 text-small font-medium text-brand">
          <StarIcon className="size-4 fill-current" /> Cuenta principal
        </span>
      ) : (
        <form action={setPrimary}>
          <input type="hidden" name="accountId" value={accountId} />
          <Button type="submit" variant="outline" disabled={settingPrimary}>
            <StarIcon className="size-4" /> {settingPrimary ? "Guardando…" : "Marcar como principal"}
          </Button>
        </form>
      )}
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <ArchiveIcon className="size-4" /> Archivar
        </Button>
      }
      title={`Archivar ${accountName}`}
      description="La cuenta deja de aparecer en tus totales y no admite nuevos movimientos. Sus movimientos históricos se conservan."
      warning={
        hasBalance ? (
          <>
            Esta cuenta todavía tiene saldo:{" "}
            <MoneyAmount amount={balance} currency={currencyCode} variant="compact" className="font-medium" />. Al
            archivarla, ese saldo deja de sumar en tu saldo total y en el dinero disponible — el movimiento no se
            borra, sólo se excluye de las cuentas activas.
          </>
        ) : undefined
      }
      confirmLabel="Archivar cuenta"
      pendingLabel="Archivando…"
      action={archiveAccountAction}
      hiddenFields={{ accountId }}
    />
    </>
  );
}
