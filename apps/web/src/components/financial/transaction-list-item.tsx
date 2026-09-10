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
  date,
  leading,
  className,
}: {
  concept: string;
  meta?: string;
  amount: string;
  currency: string;
  kind: TxnKind;
  /** KnowFinanzas.html tx-row shows a small date/currency line under the amount. */
  date?: string;
  /** Overrides the default kind glyph — e.g. a `<MerchantLogo>`. */
  leading?: React.ReactNode;
  className?: string;
}) {
  const m = KIND_META[kind];
  const Icon = m.icon;
  const tone = kind === "income" ? "positive" : kind === "expense" ? "negative" : "neutral";
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {leading ?? (
        <span aria-hidden="true" className={cn("flex size-[38px] shrink-0 items-center justify-center rounded-xl", m.wrap)}>
          <Icon className="size-[18px]" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-small font-bold text-foreground">{concept}</span>
        {meta ? <span className="truncate text-caption text-muted-foreground">{meta}</span> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <MoneyAmount
          amount={m.sign === "-" && !amount.startsWith("-") ? `-${amount}` : amount}
          currency={currency}
          variant="compact"
          tone={tone}
          className="text-small font-bold"
        />
        {date ? <span className="mt-1 text-[10px] text-muted-foreground">{date}</span> : null}
      </div>
    </div>
  );
}
