"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, PencilIcon, PlusIcon } from "lucide-react";

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
import { MoneyAmount } from "@/components/financial/money-amount";
import { archiveGoalAction, contributeGoalAction, type GoalActionState } from "../actions/goal-actions";

const initial: GoalActionState | null = null;

export function GoalActions({
  goalId,
  currencyCode,
  remainingAmount,
  status,
}: {
  goalId: string;
  currencyCode: string;
  remainingAmount: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [addState, addAction, addPending] = useActionState(contributeGoalAction, initial);
  const [, archiveAction, archivePending] = useActionState(archiveGoalAction, initial);

  if (addState?.ok && addOpen) {
    setAddOpen(false);
    router.refresh();
  }
  const addErrors = addState?.ok === false ? addState.error.fieldErrors ?? {} : {};

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
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                  <Button type="submit" disabled={addPending}>
                    {addPending ? "Guardando…" : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" render={<Link href={`/goals/${goalId}/editar`}><PencilIcon className="size-4" /> Editar</Link>} />
        </>
      ) : null}

      {status !== "ARCHIVED" ? (
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
              <DialogTitle>Archivar esta meta</DialogTitle>
              <DialogDescription>
                Sale de tu lista de metas activas. No se borra nada y podés consultarla después.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Volver</Button>} />
              <form action={archiveAction}>
                <input type="hidden" name="goalId" value={goalId} />
                <Button type="submit" variant="destructive" disabled={archivePending}>
                  {archivePending ? "Archivando…" : "Archivar meta"}
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
