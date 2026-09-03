"use client";

import { useActionState } from "react";
import { XIcon } from "lucide-react";

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
import { voidTransferAction, type TransferActionState } from "../actions/transfer-actions";

const initial: TransferActionState | null = null;

export function TransferActions({ transferId, voided }: { transferId: string; voided: boolean }) {
  const [state, action, pending] = useActionState(voidTransferAction, initial);

  if (voided) return null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <XIcon className="size-4" /> Anular transferencia
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular esta transferencia</DialogTitle>
          <DialogDescription>
            Se revierten los dos movimientos y los saldos vuelven a como estaban. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {state?.ok === false ? (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
            {state.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Volver</Button>} />
          <form action={action}>
            <input type="hidden" name="transferId" value={transferId} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Anulando…" : "Anular"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
