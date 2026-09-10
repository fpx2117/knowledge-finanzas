"use client";

import { useState } from "react";
import { ArrowLeftRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransferForm } from "./transfer-form";

type AccountOption = { id: string; name: string; currencyCode: string };

/**
 * "Transferir" — abre el formulario de transferencia en un modal con fondo blureado, sin salir
 * de Transacciones. El submit redirige a /transactions (recarga la lista, cierra el modal).
 */
export function TransferDialog({
  accounts,
  timezone,
  trigger,
}: {
  accounts: AccountOption[];
  timezone: string;
  /** Custom trigger element. Defaults to an outline "Transferir" button. */
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline">
              <ArrowLeftRightIcon className="size-4" />
              Transferir
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transferí entre tus cuentas</DialogTitle>
          <DialogDescription>
            Mové dinero de una cuenta a otra. No se registra como ingreso ni como gasto.
          </DialogDescription>
        </DialogHeader>
        <TransferForm
          accounts={accounts}
          timezone={timezone}
          cancel={<DialogClose render={<Button variant="outline">Cancelar</Button>} />}
        />
      </DialogContent>
    </Dialog>
  );
}
