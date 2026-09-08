"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, MinusIcon, PencilIcon, PlusIcon } from "lucide-react";

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
import { archiveGoalAction, contributeGoalAction, withdrawGoalAction, type GoalActionState } from "../actions/goal-actions";

const initial: GoalActionState | null = null;

export function GoalActions({
  goalId,
  currencyCode,
  remainingAmount,
  currentAmount,
  status,
}: {
  goalId: string;
  currencyCode: string;
  remainingAmount: string;
  currentAmount: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addState, addAction, addPending] = useActionState(contributeGoalAction, initial);
  const [withdrawState, withdrawAction, withdrawPending] = useActionState(withdrawGoalAction, initial);

  if (addState?.ok && addOpen) {
    setAddOpen(false);
    router.refresh();
  }
  if (withdrawState?.ok && withdrawOpen) {
    setWithdrawOpen(false);
    router.refresh();
  }
  const addErrors = addState?.ok === false ? addState.error.fieldErrors ?? {} : {};
  const withdrawErrors = withdrawState?.ok === false ? withdrawState.error.fieldErrors ?? {} : {};

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon className="size-4" /> Registrar ahorro
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar un aporte</DialogTitle>
                <DialogDescription>
                  Sumá lo que apartaste para esta meta. Te falta{" "}
                  <MoneyAmount amount={remainingAmount} currency={currencyCode} variant="compact" />.
                </DialogDescription>
              </DialogHeader>
              <form action={addAction} className="flex flex-col gap-4">
                <input type="hidden" name="goalId" value={goalId} />
                {addState?.ok === false ? (
                  <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                    {addState.error.message}
                  </p>
                ) : null}
                <Field label={`Monto (${currencyCode})`} htmlFor="amount" error={addErrors.amount?.[0]}>
                  <input id="amount" name="amount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
                </Field>
                <Field label="Nota (opcional)" htmlFor="add-note" error={addErrors.note?.[0]}>
                  <input id="add-note" name="note" type="text" placeholder="Bono de septiembre" className={fieldControlClass} />
                </Field>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                  <Button type="submit" disabled={addPending}>
                    {addPending ? "Guardando…" : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" render={<Link href={`/goals/${goalId}/edit`}><PencilIcon className="size-4" /> Editar</Link>} />
        </>
      ) : null}

      {status !== "ARCHIVED" && Number(currentAmount) > 0 ? (
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger render={<Button variant="outline"><MinusIcon className="size-4" /> Retirar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retirar de esta meta</DialogTitle>
              <DialogDescription>
                Baja el progreso de la meta. No mueve dinero entre tus cuentas ni registra un gasto — sólo ajusta cuánto tenés
                asignado acá. Llevás <MoneyAmount amount={currentAmount} currency={currencyCode} variant="compact" />.
              </DialogDescription>
            </DialogHeader>
            <form action={withdrawAction} className="flex flex-col gap-4">
              <input type="hidden" name="goalId" value={goalId} />
              {withdrawState?.ok === false ? (
                <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
                  {withdrawState.error.message}
                </p>
              ) : null}
              <Field label={`Monto (${currencyCode})`} htmlFor="withdraw-amount" error={withdrawErrors.amount?.[0]}>
                <input id="withdraw-amount" name="amount" type="text" inputMode="decimal" required placeholder="0.00" className={fieldControlClass} />
              </Field>
              <Field label="Nota (opcional)" htmlFor="withdraw-note" error={withdrawErrors.note?.[0]}>
                <input id="withdraw-note" name="note" type="text" placeholder="Reasigné a otra meta" className={fieldControlClass} />
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                <Button type="submit" disabled={withdrawPending}>
                  {withdrawPending ? "Guardando…" : "Retirar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {status !== "ARCHIVED" ? (
        <ConfirmDialog
          trigger={<Button variant="outline"><ArchiveIcon className="size-4" /> Archivar</Button>}
          title="Archivar esta meta"
          description="Sale de tu lista de metas activas. No se borra nada y podés consultarla después."
          confirmLabel="Archivar meta"
          pendingLabel="Archivando…"
          cancelLabel="Volver"
          action={archiveGoalAction}
          hiddenFields={{ goalId }}
          onSuccess={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
