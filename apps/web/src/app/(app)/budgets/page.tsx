import Link from "next/link";
import { ChevronRightIcon, TriangleAlertIcon, WalletIcon } from "lucide-react";

import { budgetRepository, categoryRepository, createActivityQueries, createBudgetQueries, db } from "@know-finanzas/db";
import { todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { MonthNav } from "@/components/shared/month-nav";
import { DataFreshnessNote } from "@/components/shared/data-freshness-note";
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

const activityQueries = createActivityQueries(db);

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
const MONTH_LABEL = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" });

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const currentPeriod = today.slice(0, 7);
  const requested = (await searchParams).period;
  // spec 04 §8.4 — navegación temporal; nunca al futuro (no se presupuesta lo que no pasó).
  const period = requested?.match(/^\d{4}-\d{2}$/) && requested <= currentPeriod ? requested : currentPeriod;
  const [year, month] = period.split("-").map(Number);

  const [budgets, recent] = await Promise.all([
    period === currentPeriod ? service.getBudgetOverview(user) : service.getBudgetOverviewForMonth(user, year, month),
    activityQueries.listRecentActivity(user.id, { limit: 1 }).catch(() => []),
  ]);
  const lastMovementDate = recent[0]?.occurredAt
    ? todayInTimezone(new Date(recent[0].occurredAt as string | Date), user.timezone)
    : null;

  const header = (
    <PageHeader
      title="Presupuestos"
      description="Controlá cuánto querés gastar y cómo viene el mes."
      actions={
        <>
          <MonthNav current={currentPeriod} />
          <Button
            variant={budgets.length > 0 ? "outline" : "default"}
            render={<Link href="/budgets/new">{budgets.length > 0 ? "Editar presupuesto" : "Crear presupuesto"}</Link>}
          />
        </>
      }
    />
  );

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <EmptyState
          icon={<WalletIcon />}
          title={`Todavía no configuraste un presupuesto para ${MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)))}`}
          description="Definí cuánto querés gastar por categoría y seguí tu avance mes a mes. Usá el botón de arriba para empezar."
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
      {header}

      {/* spec 04 §9.9 — hasta cuándo hay datos: si faltan gastos recientes el consumo se ve bajo. */}
      <DataFreshnessNote lastMovementDate={lastMovementDate} todayISO={today} />

      {/* spec 04 §9.3 — Presupuestado / Gastado (+%) / Restante (o Excedido) / En atención (§9.3
          Card D: nunca "mal", "fracaso", "descontrol"). */}
      <section aria-label="Resumen de presupuestos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Presupuestado" icon={WalletIcon} value={String(totalLimit)} currency={currency} info="Suma de los límites configurados para este mes." />
        <StatCard label="Gastado" value={String(totalSpent)} currency={currency} info="Incluye gastos confirmados del período asociados a categorías presupuestadas.">
          <span className="flex flex-col gap-2">
            <MoneyAmount amount={String(totalSpent)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
            <ProgressBar value={pct} state={pct >= 100 ? "exceeded" : pct >= 80 ? "warning" : "normal"} aria-label={`${Math.round(pct)}% del presupuesto usado`} />
            <span className="text-caption text-muted-foreground">{Math.round(pct)}% del presupuesto</span>
          </span>
        </StatCard>
        <StatCard
          label={totalRemaining < 0 ? "Excedido" : "Restante"}
          tone={totalRemaining < 0 ? "negative" : "positive"}
          value={String(Math.abs(totalRemaining))}
          currency={currency}
          hint={totalRemaining < 0 ? "Gastaste más de lo presupuestado" : "Margen que te queda este mes"}
        />
        <StatCard label="En atención" icon={TriangleAlertIcon} tone={atRisk > 0 ? "warning" : "neutral"}>
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{atRisk}</span>
            <span className="text-small font-normal text-muted-foreground">
              {atRisk === 0 ? "Todo en control" : atRisk === 1 ? "categoría" : "categorías"}
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
                    <TableRow key={budget.budgetId} className="hover:bg-brand-subtle/60">
                      <TableCell className="py-2.5 pl-5 sm:pl-6">
                        <Link href={`/budgets/${budget.budgetId}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                          {budget.categoryName}
                        </Link>
                        <span className="block text-caption text-muted-foreground">
                          {Number(budget.spent) === 0
                            ? "Sin consumo este mes"
                            : Number(budget.remaining) < 0
                              ? `Excedido por ${new Intl.NumberFormat("es-AR", { style: "currency", currency: budget.currencyCode, maximumFractionDigits: 0 }).format(Math.abs(Number(budget.remaining)))}`
                              : `Quedan ${new Intl.NumberFormat("es-AR", { style: "currency", currency: budget.currencyCode, maximumFractionDigits: 0 }).format(Number(budget.remaining))}`}
                        </span>
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
