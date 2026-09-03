"use client";

import { useActionState, useState } from "react";
import { ArchiveIcon, PencilIcon } from "lucide-react";

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
import { archiveBudgetAction, updateBudgetAction, type BudgetActionState } from "../actions/budget-actions";

const initial: BudgetActionState | null = null;

export function BudgetManage({
  budgetId,
  currentLimit,
  currentName,
}: {
  budgetId: string;
  currentLimit: string;
  currentName: string | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editState, editAction, editPending] = useActionState(updateBudgetAction, initial);
  const [, archiveAction, archivePending] = useActionState(archiveBudgetAction, initial);

  if (editState?.ok && editOpen) setEditOpen(false);
  const editErrors = editState?.ok === false ? editState.error.fieldErrors ?? {} : {};

  return (
    <div className="flex gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <PencilIcon className="size-4" /> Editar límite
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar presupuesto</DialogTitle>
            <DialogDescription>Ajustá el límite mensual o el nombre.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="flex flex-col gap-4">
            <input type="hidden" name="budgetId" value={budgetId} />
            {editState?.ok === false ? (
              <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                {editState.error.message}
              </p>
            ) : null}
            <Field label="Límite mensual" htmlFor="limitAmount" error={editErrors.limitAmount?.[0]}>
              <input id="limitAmount" name="limitAmount" type="text" inputMode="decimal" required defaultValue={currentLimit} className={fieldControlClass} />
            </Field>
            <Field label="Nombre" htmlFor="name" help="Opcional">
              <input id="name" name="name" type="text" defaultValue={currentName ?? ""} className={fieldControlClass} />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={editPending}>
                {editPending ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="outline">
              <ArchiveIcon className="size-4" /> Archivar
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archivar presupuesto</DialogTitle>
            <DialogDescription>Deja de seguir esta categoría. Podés crear uno nuevo más adelante.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <form action={archiveAction}>
              <input type="hidden" name="budgetId" value={budgetId} />
              <Button type="submit" variant="destructive" disabled={archivePending}>
                {archivePending ? "Archivando…" : "Archivar"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
