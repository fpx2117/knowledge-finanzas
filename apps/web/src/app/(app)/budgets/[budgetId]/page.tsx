import { notFound } from "next/navigation";
import { resourceIdOr404 } from "@/lib/http/resource-id";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";
import { isApplicationError } from "@know-finanzas/shared";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip } from "@/components/shared/status-chip";
import { ProgressBar } from "@/components/shared/progress-bar";
import { MoneyAmount } from "@/components/financial/money-amount";
import { TransactionListItem, type TxnKind } from "@/components/financial/transaction-list-item";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate } from "@/lib/format";
import { createBudgetService } from "@/features/budgets/services/budget-service";
import { BudgetManage } from "@/features/budgets/components/budget-manage";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
});

const STATUS_META = {
  NORMAL: { label: "En control", tone: "positive" as const, bar: "normal" as const },
  NEAR_LIMIT: { label: "Al límite", tone: "warning" as const, bar: "warning" as const },
  EXCEEDED: { label: "Excedido", tone: "negative" as const, bar: "exceeded" as const },
};

export default async function BudgetDetailPage({ params }: { params: Promise<{ budgetId: string }> }) {
  const { budgetId: budgetIdParam } = await params;
  const budgetId = resourceIdOr404(budgetIdParam);
  const user = await requireCurrentUser();

  let detail;
  try {
    detail = await service.getBudgetDetail(user, budgetId);
  } catch (error) {
    if (isApplicationError(error) && error.code === "BUDGET_NOT_FOUND") notFound();
    throw error;
  }

  const meta = STATUS_META[detail.status];
  const usage = Number(detail.usagePercent);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        breadcrumb={[{ label: "Presupuestos", href: "/budgets" }, { label: detail.name ?? detail.categoryName }]}
        title={detail.name ?? detail.categoryName}
        description={`Presupuesto mensual · ${detail.currencyCode}`}
        actions={
          detail.budgetStatus === "ACTIVE" ? (
            <BudgetManage budgetId={detail.budgetId} currentLimit={detail.limit} currentName={detail.name} />
          ) : undefined
        }
      />

      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Gastado este mes</span>
              <MoneyAmount amount={detail.spent} currency={detail.currencyCode} className="text-metric-xl font-medium" />
              <span className="text-small text-muted-foreground">
                de <MoneyAmount amount={detail.limit} currency={detail.currencyCode} variant="compact" className="text-small text-muted-foreground" /> ·{" "}
                <MoneyAmount amount={detail.remaining} currency={detail.currencyCode} variant="compact" className="text-small text-muted-foreground" /> disponible
              </span>
            </div>
            <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
          </div>
          <ProgressBar value={usage} state={meta.bar} aria-label={`${Math.round(usage)}% usado`} />
          <span className="text-caption text-muted-foreground">{Math.round(usage)}% del límite</span>
        </CardContent>
      </Card>

      <SectionCard title="Movimientos que suman a este presupuesto" eyebrow="Este mes">
        {detail.transactions.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {detail.transactions.map((txn) => {
              const kind: TxnKind = txn.type === "REFUND" ? "income" : "expense";
              return (
                <li key={txn.id}>
                  <TransactionListItem
                    concept={txn.description || txn.merchant || "Movimiento"}
                    meta={formatShortDate(txn.occurredAt)}
                    amount={String(txn.amount)}
                    currency={txn.currencyCode}
                    kind={kind}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-small text-muted-foreground">Todavía no hay gastos en esta categoría este mes.</p>
        )}
      </SectionCard>
    </div>
  );
}
