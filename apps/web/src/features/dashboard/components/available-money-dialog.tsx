"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoneyAmount } from "@/components/financial/money-amount";
import { formatShortDate } from "@/lib/format";

export type AvailableMoneyCommitment = {
  sourceId: string;
  title: string;
  dueDate: string;
  amount: string;
  isOverdue: boolean;
};

/**
 * Spec 01 §9.4: "Ver cálculo" must open an explanation with the exact components
 * behind "dinero disponible" — never just a tooltip. Each obligation can expand
 * (§9.4) to show its due date. §9.5: the coverage window must be explicit.
 */
export function AvailableMoneyDialog({
  currency,
  liquidBalance,
  committedObligations,
  spendable,
  horizonEnd,
  commitments,
}: {
  currency: string;
  liquidBalance: string;
  committedObligations: string;
  spendable: string;
  horizonEnd: string;
  commitments: AvailableMoneyCommitment[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className="text-small font-medium text-brand hover:underline" />}>
        Ver cálculo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cómo calculamos tu dinero disponible</DialogTitle>
          <DialogDescription>Después de compromisos registrados hasta el {formatShortDate(horizonEnd)}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-small">
            <span className="text-muted-foreground">Saldo confirmado</span>
            <MoneyAmount amount={liquidBalance} currency={currency} variant="compact" className="font-medium text-foreground" />
          </div>
          <div className="flex items-center justify-between text-small">
            <span className="text-muted-foreground">Obligaciones comprometidas</span>
            <MoneyAmount
              amount={`-${committedObligations}`}
              currency={currency}
              variant="compact"
              className="font-medium text-[var(--negative)]"
            />
          </div>
          <div className="my-1 border-t border-border" />
          <div className="flex items-center justify-between text-small font-semibold text-foreground">
            <span>Disponible</span>
            <MoneyAmount amount={spendable} currency={currency} variant="compact" className="font-semibold" />
          </div>
        </div>

        {commitments.length > 0 ? (
          <div className="flex flex-col divide-y divide-border border-t border-border pt-1">
            {commitments.map((item) => (
              <div key={item.sourceId}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === item.sourceId ? null : item.sourceId)}
                  aria-expanded={openId === item.sourceId}
                  className="flex w-full items-center justify-between gap-2 py-2 text-left text-small"
                >
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-foreground">
                    {openId === item.sourceId ? (
                      <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </span>
                  <MoneyAmount amount={item.amount} currency={currency} variant="compact" className="shrink-0 text-muted-foreground" />
                </button>
                {openId === item.sourceId ? (
                  <p className="pb-2 pl-5 text-caption text-muted-foreground">
                    Vence el {formatShortDate(item.dueDate)}
                    {item.isOverdue ? " · Vencida" : ""}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <p className="text-caption text-muted-foreground">No contamos ingresos futuros hasta que efectivamente ocurren.</p>
      </DialogContent>
    </Dialog>
  );
}
