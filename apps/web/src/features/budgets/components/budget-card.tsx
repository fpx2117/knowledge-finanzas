import Link from "next/link";

import { MoneyAmount } from "@/components/financial/money-amount";

type BudgetCardItem = {
  budgetId: string;
  categoryName: string;
  currencyCode: string;
  limit: string;
  spent: string;
  remaining: string;
  usagePercent: string;
  status: "NORMAL" | "NEAR_LIMIT" | "EXCEEDED";
};

const STATUS_LABEL: Record<BudgetCardItem["status"], string> = {
  NORMAL: "Dentro del presupuesto",
  NEAR_LIMIT: "Cerca del límite",
  EXCEEDED: "Presupuesto excedido",
};

const STATUS_CLASS: Record<BudgetCardItem["status"], string> = {
  NORMAL: "normal",
  NEAR_LIMIT: "near-limit",
  EXCEEDED: "exceeded",
};

export function BudgetCard({ item, linkToDetail = true }: { item: BudgetCardItem; linkToDetail?: boolean }) {
  const isOverLimit = item.status === "EXCEEDED";
  const progressWidth = Math.min(100, Math.max(0, Number(item.usagePercent)));

  const content = (
    <>
      <div className="budget-card-topline">
        <div>
          <strong>{item.categoryName}</strong>
          <p className="card-helper">
            <MoneyAmount amount={item.spent} currency={item.currencyCode} /> / <MoneyAmount amount={item.limit} currency={item.currencyCode} />
          </p>
        </div>
        <span className={`status-badge ${STATUS_CLASS[item.status]}`}>{STATUS_LABEL[item.status]}</span>
      </div>
      <div className="budget-progress" role="progressbar" aria-valuenow={progressWidth} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.categoryName}: ${item.usagePercent}% del presupuesto utilizado`}>
        <div className={`budget-progress-fill ${STATUS_CLASS[item.status]}`} style={{ width: `${progressWidth}%` }} />
      </div>
      <p className="budget-card-footline">
        {isOverLimit
          ? <><MoneyAmount amount={item.remaining.replace("-", "")} currency={item.currencyCode} /> por encima del límite</>
          : <><MoneyAmount amount={item.remaining} currency={item.currencyCode} /> disponibles</>}
        {" · "}{item.usagePercent}%
      </p>
    </>
  );

  if (!linkToDetail) return <article className="budget-card">{content}</article>;

  return (
    <Link className="budget-card budget-card-link" href={`/budgets/${item.budgetId}`}>
      {content}
    </Link>
  );
}
