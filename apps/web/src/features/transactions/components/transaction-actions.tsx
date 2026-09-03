"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon, RefreshCwIcon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/shared/form-field";
import {
  createTemplateFromTransactionAction,
  type RepeatPrefill,
  type TemplateActionState,
} from "@/features/capture/actions/quick-actions";
import { openQuickAdd } from "@/features/capture/components/quick-add-root";
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
import { voidTransactionAction, type VoidTransactionState } from "../actions/void-transaction";

const initialState: VoidTransactionState | null = null;
const initialTemplateState: TemplateActionState | null = null;

export function TransactionActions({
  transactionId,
  repeatPrefill,
}: {
  transactionId: string;
  repeatPrefill: RepeatPrefill | null;
}) {
  const router = useRouter();
  const [voidOpen, setVoidOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [voidState, voidAction, voidPending] = useActionState(voidTransactionAction, initialState);
  const [templateState, templateAction, templatePending] = useActionState(
    createTemplateFromTransactionAction,
    initialTemplateState,
  );

  useEffect(() => {
    if (!voidState?.ok) return;
    setVoidOpen(false);
    router.push("/transactions");
  }, [router, voidState]);

  useEffect(() => {
    if (!templateState?.ok) return;
    setTemplateOpen(false);
    toast.success("Acción rápida guardada");
  }, [templateState]);

  return (
    <div className="flex flex-wrap gap-2">
      {repeatPrefill ? (
        <Button type="button" variant="outline" onClick={() => openQuickAdd(repeatPrefill)}>
          <RefreshCwIcon className="size-4" /> Registrar de nuevo
        </Button>
      ) : null}

      {repeatPrefill ? (
        <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
          <DialogTrigger
            render={
              <Button variant="outline">
                <BookmarkIcon className="size-4" /> Guardar acción rápida
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar acción rápida</DialogTitle>
              <DialogDescription>
                La próxima vez solo elegís esta acción, ajustás el monto si hace falta y confirmás.
              </DialogDescription>
            </DialogHeader>
            <form action={templateAction} className="flex flex-col gap-4">
              <input type="hidden" name="transactionId" value={transactionId} />
              <label className="flex flex-col gap-1.5 text-small font-medium" htmlFor="quick-template-label">
                Nombre
                <input
                  id="quick-template-label"
                  name="label"
                  required
                  maxLength={40}
                  defaultValue={repeatPrefill.description}
                  className={fieldControlClass}
                />
              </label>
              {templateState?.ok === false ? (
                <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                  {templateState.error.message}
                </p>
              ) : null}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
                <Button type="submit" disabled={templatePending}>
                  {templatePending ? "Guardando…" : "Guardar acción"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <Undo2Icon className="size-4" /> Anular
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular movimiento</DialogTitle>
            <DialogDescription>
              El movimiento se marca como anulado y su efecto sobre el saldo de la cuenta se revierte. Queda en el historial.
            </DialogDescription>
          </DialogHeader>
          {voidState?.ok === false ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
              {voidState.error.message}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <form action={voidAction}>
              <input type="hidden" name="transactionId" value={transactionId} />
              <Button type="submit" variant="destructive" disabled={voidPending}>
                {voidPending ? "Anulando…" : "Anular movimiento"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
