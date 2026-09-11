"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon, PencilIcon, RefreshCwIcon, Undo2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { kaiToast } from "@/components/shared/kai-toast";
import { fieldControlClass } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { voidTransactionAction } from "../actions/void-transaction";
import { editTransactionAction, type EditTransactionState } from "../actions/edit-transaction";

const initialTemplateState: TemplateActionState | null = null;
const initialEditState: EditTransactionState | null = null;

export type EditableTransaction = {
  type: "INCOME" | "EXPENSE";
  description: string;
  merchant: string;
  categoryId: string;
  notes: string;
  categoryOptions: Array<{ id: string; name: string }>;
};

export function TransactionActions({
  transactionId,
  repeatPrefill,
  editable,
}: {
  transactionId: string;
  repeatPrefill: RepeatPrefill | null;
  editable?: EditableTransaction | null;
}) {
  const router = useRouter();
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [templateState, templateAction, templatePending] = useActionState(
    createTemplateFromTransactionAction,
    initialTemplateState,
  );
  const [editState, editAction, editPending] = useActionState(editTransactionAction, initialEditState);

  useEffect(() => {
    if (!templateState?.ok) return;
    setTemplateOpen(false);
    kaiToast("Guardé la acción rápida.", { state: "POSITIVE", duration: 3500 });
  }, [templateState]);

  useEffect(() => {
    if (!editState?.ok) return;
    setEditOpen(false);
    kaiToast("Actualicé el movimiento.", { state: "POSITIVE", duration: 3500 });
    router.refresh();
    window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
  }, [router, editState]);

  return (
    <div className="flex flex-wrap gap-2">
      {editable ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger render={<Button variant="outline"><PencilIcon className="size-4" /> Editar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar movimiento</DialogTitle>
              <DialogDescription>
                Podés corregir la descripción, el comercio, la categoría o las notas. El monto, la fecha, la cuenta y el
                tipo no se pueden cambiar acá — anulá el movimiento y registralo de nuevo si esos datos están mal.
              </DialogDescription>
            </DialogHeader>
            <form action={editAction} className="flex flex-col gap-4">
              <input type="hidden" name="transactionId" value={transactionId} />
              <label className="flex flex-col gap-1.5 text-small font-medium" htmlFor="edit-description">
                Descripción
                <input
                  id="edit-description"
                  name="description"
                  required
                  maxLength={240}
                  defaultValue={editable.description}
                  className={fieldControlClass}
                />
              </label>
              {editable.type === "EXPENSE" ? (
                <label className="flex flex-col gap-1.5 text-small font-medium" htmlFor="edit-merchant">
                  Comercio
                  <input id="edit-merchant" name="merchant" maxLength={160} defaultValue={editable.merchant} className={fieldControlClass} />
                </label>
              ) : null}
              <label className="flex flex-col gap-1.5 text-small font-medium" htmlFor="edit-categoryId">
                Categoría
                <select id="edit-categoryId" name="categoryId" defaultValue={editable.categoryId} className={fieldControlClass}>
                  <option value="">Sin categoría</option>
                  {editable.categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-small font-medium" htmlFor="edit-notes">
                Notas
                <textarea id="edit-notes" name="notes" maxLength={2000} rows={3} defaultValue={editable.notes} className={fieldControlClass} />
              </label>
              {editState?.ok === false ? (
                <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                  {editState.error.message}
                </p>
              ) : null}
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
                <Button type="submit" disabled={editPending}>
                  {editPending ? "Guardando…" : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

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

      <ConfirmDialog
        trigger={<Button variant="outline"><Undo2Icon className="size-4" /> Anular</Button>}
        title="Anular movimiento"
        description="El movimiento se marca como anulado y su efecto sobre el saldo de la cuenta se revierte. Queda en el historial."
        confirmLabel="Anular movimiento"
        pendingLabel="Anulando…"
        action={voidTransactionAction}
        hiddenFields={{ transactionId }}
        onSuccess={() => {
          router.refresh();
          window.dispatchEvent(new CustomEvent("kai:refresh-proactive"));
        }}
      />
    </div>
  );
}
