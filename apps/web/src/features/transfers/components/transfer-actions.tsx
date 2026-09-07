"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { voidTransferAction } from "../actions/transfer-actions";

export function TransferActions({ transferId, voided }: { transferId: string; voided: boolean }) {
  if (voided) return null;

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline">
          <XIcon className="size-4" /> Anular transferencia
        </Button>
      }
      title="Anular esta transferencia"
      description="Se revierten los dos movimientos y los saldos vuelven a como estaban. No se puede deshacer."
      confirmLabel="Anular transferencia"
      pendingLabel="Anulando…"
      cancelLabel="Volver"
      action={voidTransferAction}
      hiddenFields={{ transferId }}
    />
  );
}
