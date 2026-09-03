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
import { archiveAccountAction, type ArchiveAccountState } from "../actions/archive-account";

const initialState: ArchiveAccountState | null = null;

export function AccountActions({ accountId, accountName }: { accountId: string; accountName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(archiveAccountAction, initialState);

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
