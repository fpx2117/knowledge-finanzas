"use client";

import { useActionState, useEffect, useState } from "react";

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

type ConfirmResult = { ok: true } | { ok: false; error: { message: string } };
// The destructive server actions all share this shape but declare their own `error` type (UiError,
// which extends `{ message }`) and their own `previousState` param — accept any of them.
type ConfirmAction = (previousState: never, formData: FormData) => Promise<ConfirmResult>;

/**
 * Spec 13 §22.1 — the one way to ask for a destructive confirmation: a specific title (the exact
 * action + object), a clear consequence, a named destructive CTA, and an easy way out. Focus trap
 * + restore come from the underlying Dialog (§22.3). §24.2 — a failed operation also shows its
 * error inline here, never only as a toast.
 *
 * Reserve this for irreversible / money-affecting actions; do not wrap reversible, trivial ones
 * (§22.2).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  warning,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  action,
  hiddenFields = {},
  onSuccess,
}: {
  /** The button that opens the dialog. */
  trigger: React.ReactElement;
  title: string;
  description: React.ReactNode;
  /** Extra consequence the user must see before confirming (e.g. "this account still has a balance"). */
  warning?: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel?: string;
  action: ConfirmAction;
  hiddenFields?: Record<string, string>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ConfirmResult | null, FormData>(
    action as unknown as (s: ConfirmResult | null, f: FormData) => Promise<ConfirmResult>,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const error = state && state.ok === false ? state.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {warning ? (
          <div role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
            {warning}
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">{cancelLabel}</Button>} />
          <form action={formAction}>
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
