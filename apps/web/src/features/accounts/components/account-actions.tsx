"use client";

import { ArchiveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MoneyAmount } from "@/components/financial/money-amount";
import { archiveAccountAction } from "../actions/archive-account";

// OQ-007: archiving a non-zero-balance account is allowed — it doesn't destroy or move money,
// transactions/history stay intact — but the user must see, before confirming, that this balance
// is about to drop out of their totals (spec 13 §22.1 "consecuencia clara").
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
  const hasBalance = Number(balance) !== 0;

  return (
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
  );
}
