import Link from "next/link";
import { ChevronRightIcon, TriangleAlertIcon, WalletIcon } from "lucide-react";

import { budgetRepository, categoryRepository, createBudgetQueries, db } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusChip } from "@/components/shared/status-chip";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
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

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

export default async function BudgetsPage() {
  const user = await requireCurrentUser();
  const budgets = await service.getBudgetOverview(user);

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Presupuestos"
          description="Planificá, controlá y ajustá tus gastos por categoría."
          actions={
            <>
              <HeaderActions />
              <Button render={<Link href="/budgets/new">Nuevo presupuesto</Link>} />
            </>
          }
        />
        <EmptyState
          icon={<WalletIcon />}
          title="Todavía no tenés presupuestos"
          description="Definí cuánto querés gastar por categoría y seguí tu avance mes a mes."
          action={<Button render={<Link href="/budgets/new">Crear presupuesto</Link>} />}
        />
      </div>
    );
  }

  const currency = budgets[0].currencyCode;
  const scoped = budgets.filter((b) => b.currencyCode === currency);
  const totalLimit = scoped.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = scoped.reduce((s, b) => s + Number(b.spent), 0);
  const totalRemaining = totalLimit - totalSpent;
  const pct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const atRisk = budgets.filter((b) => b.status !== "NORMAL").length;

  const donutSegments: DonutSegment[] = scoped
    .slice(0, 6)
    .map((b, i) => ({ label: b.categoryName, value: Number(b.limit), color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Presupuestos"
        description="Planificá, controlá y ajustá tus gastos por categoría."
        actions={
          <>
            <HeaderActions />
            <Button render={<Link href="/budgets/new">Nuevo presupuesto</Link>} />
          </>
        }
      />

      <section aria-label="Resumen de presupuestos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Presupuesto total" icon={WalletIcon} value={String(totalLimit)} currency={currency} hint="Suma de tus límites" />
        <StatCard label="Gastado" value={String(totalSpent)} currency={currency}>
          <span className="flex flex-col gap-2">
            <MoneyAmount amount={String(totalSpent)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
            <ProgressBar value={pct} state={pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "normal"} aria-label={`${Math.round(pct)}% usado`} />
            <span className="text-caption text-muted-foreground">{Math.round(pct)}% del total</span>
          </span>
        </StatCard>
        <StatCard
          label="Disponible"
          tone={totalRemaining < 0 ? "negative" : "positive"}
          value={String(totalRemaining)}
          currency={currency}
          hint="Lo que te queda este mes"
        />
        <StatCard label="Categorías en riesgo" icon={TriangleAlertIcon} tone={atRisk > 0 ? "warning" : "neutral"}>
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{atRisk}</span>
            <span className="text-small font-normal text-muted-foreground">
              {atRisk === 0 ? "Todo en control" : "Requieren tu atención"}
            </span>
          </span>
        </StatCard>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <SectionCard title="Presupuestos del mes" contentClassName="gap-0">
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
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Distribución del presupuesto" eyebrow={currency}>
            <DonutChart
              segments={donutSegments}
              centerLabel="Total"
              centerValue={new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(totalLimit)}
            />
          </SectionCard>

          <InsightCard title={atRisk > 0 ? "Atención" : "Vas bien"}>
            <p>
              {atRisk > 0
                ? `${atRisk} ${atRisk === 1 ? "categoría está" : "categorías están"} cerca o por encima del límite. Revisá tus gastos ahí.`
                : `Llevás gastado el ${Math.round(pct)}% de tu presupuesto total del mes.`}
            </p>
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
