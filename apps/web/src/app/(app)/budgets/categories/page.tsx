import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";

import { todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { MonthNav } from "@/components/shared/month-nav";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService, type BudgetOverviewItem } from "@/features/budgets/services/budget-service";

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
});

const STATUS_META: Record<
  BudgetOverviewItem["status"],
  { label: string; tone: "positive" | "warning" | "negative"; bar: "normal" | "warning" | "exceeded" }
> = {
  NORMAL: { label: "En control", tone: "positive", bar: "normal" },
  NEAR_LIMIT: { label: "Al límite", tone: "warning", bar: "warning" },
  EXCEEDED: { label: "Excedido", tone: "negative", bar: "exceeded" },
};
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// WP-ROUTES-SUBVIEWS: the "por categoría" spec subview (04 §3) — every budget as a browsable
// table, no dashboard stat cards. /budgets (Resumen) stays the higher-level view.
export default async function BudgetsByCategoryPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const currentPeriod = today.slice(0, 7);
  const requested = (await searchParams).period;
  const period = requested?.match(/^\d{4}-\d{2}$/) && requested <= currentPeriod ? requested : currentPeriod;
  const [year, month] = period.split("-").map(Number);
  const budgets =
    period === currentPeriod ? await service.getBudgetOverview(user) : await service.getBudgetOverviewForMonth(user, year, month);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Presupuestos / Por categoría"
        description="Todos tus presupuestos activos, uno por categoría."
        actions={
          <>
            <MonthNav current={currentPeriod} />
            <Button render={<Link href="/budgets/new">Nuevo presupuesto</Link>} />
          </>
        }
      />

      <SectionCard title="Categorías" eyebrow={`${budgets.length}`} contentClassName="gap-0">
        {budgets.length === 0 ? (
          <EmptyState title="Todavía no tenés presupuestos" description="Definí cuánto querés gastar por categoría." />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Categoría</TableHead>
                  <TableHead className={`hidden text-right sm:table-cell ${HEAD}`}>Límite</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Gastado</TableHead>
                  <TableHead className={`hidden w-40 md:table-cell ${HEAD}`}>Progreso</TableHead>
                  <TableHead className={HEAD}>Estado</TableHead>
                  <TableHead className="w-8 pr-5 sm:pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const meta = STATUS_META[budget.status];
                  const usage = Number(budget.usagePercent);
                  return (
                    <TableRow key={budget.budgetId} className="h-[52px] hover:bg-brand-subtle/60">
                      <TableCell className="pl-5 sm:pl-6">
                        <Link href={`/budgets/${budget.budgetId}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                          {budget.categoryName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        <MoneyAmount amount={budget.limit} currency={budget.currencyCode} variant="compact" className="text-small text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyAmount amount={budget.spent} currency={budget.currencyCode} variant="compact" className="text-small font-medium" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={usage} state={meta.bar} className="w-24" aria-label={`${Math.round(usage)}% usado`} />
                          <span className="text-caption tabular-nums text-muted-foreground">{Math.round(usage)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                      </TableCell>
                      <TableCell className="pr-5 sm:pr-6">
                        <Link href={`/budgets/${budget.budgetId}`} aria-label={`Ver ${budget.categoryName}`} className="text-muted-foreground hover:text-foreground">
                          <ChevronRightIcon className="size-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
