import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ArrowLeftRightIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { MoneyAmount } from "@/components/financial/money-amount";
import { cn } from "@/lib/utils";

export type TxnKind = "income" | "expense" | "transfer" | "adjustment";

const KIND_META: Record<TxnKind, { icon: typeof ArrowDownLeftIcon; wrap: string; sign: "+" | "-" | "" }> = {
  income: { icon: ArrowDownLeftIcon, wrap: "bg-success-soft text-[var(--success)]", sign: "+" },
  expense: { icon: ArrowUpRightIcon, wrap: "bg-negative-soft text-[var(--negative)]", sign: "-" },
  transfer: { icon: ArrowLeftRightIcon, wrap: "bg-brand-subtle text-brand", sign: "" },
  adjustment: { icon: SlidersHorizontalIcon, wrap: "bg-secondary text-foreground-secondary", sign: "" },
};

/** A single movement row — used in account detail, transactions, dashboard activity. */
export function TransactionListItem({
  concept,
  meta,
  amount,
  currency,
  kind,
  className,
}: {
  concept: string;
  meta?: string;
  amount: string;
  currency: string;
  kind: TxnKind;
  className?: string;
}) {
  const m = KIND_META[kind];
  const Icon = m.icon;
  const tone = kind === "income" ? "positive" : kind === "expense" ? "negative" : "neutral";
  return (
    <div className={cn("flex items-center gap-3 py-2.5", className)}>
      <span aria-hidden="true" className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", m.wrap)}>
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-small font-medium text-foreground">{concept}</span>
        {meta ? <span className="truncate text-caption text-muted-foreground">{meta}</span> : null}
      </div>
      <MoneyAmount
        amount={m.sign === "-" && !amount.startsWith("-") ? `-${amount}` : amount}
        currency={currency}
        variant="compact"
        tone={tone}
        className="shrink-0 text-small font-medium"
      />
    </div>
  );
}
