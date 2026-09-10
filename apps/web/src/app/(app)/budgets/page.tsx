import Link from "next/link";
import { PencilIcon, TriangleAlertIcon, WalletIcon } from "lucide-react";

import { budgetRepository, categoryRepository, createActivityQueries, createBudgetQueries, db } from "@know-finanzas/db";
import { todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { MonthNav } from "@/components/shared/month-nav";
import { DataFreshnessNote } from "@/components/shared/data-freshness-note";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { InfoBar } from "@/components/shared/info-bar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { EntityGrid, EntityCard, AddEntityCard } from "@/components/shared/entity-grid";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createBudgetService } from "@/features/budgets/services/budget-service";

const activityQueries = createActivityQueries(db);

const service = createBudgetService({
  budgets: budgetRepository,
  categories: categoryRepository,
  budgetQueries: createBudgetQueries(db),
});

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const MONTH_LABEL = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

function fmt(value: number | string, currency: string) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireCurrentUser();
  const today = todayInTimezone(new Date(), user.timezone);
  const currentPeriod = today.slice(0, 7);
  const requested = (await searchParams).period;
  // spec 04 §8.4 — navegación temporal; nunca al futuro (no se presupuesta lo que no pasó).
  const period = requested?.match(/^\d{4}-\d{2}$/) && requested <= currentPeriod ? requested : currentPeriod;
  const [year, month] = period.split("-").map(Number);
  const monthName = MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)));

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
      description={`Decidí cuánto querés gastar. ${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}.`}
      actions={
        <>
          <MonthNav current={currentPeriod} />
          <Button render={<Link href="/budgets/new">Crear</Link>} />
        </>
      }
    />
  );

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <EmptyState
          size="section"
          icon={<WalletIcon />}
          title="Gastá con más intención."
          description={`Elegí una categoría y un límite para ${monthName}. Los gastos que registres actualizarán el progreso automáticamente.`}
          action={<Button render={<Link href="/budgets/new">Crear un presupuesto</Link>} />}
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

      <DataFreshnessNote lastMovementDate={lastMovementDate} todayISO={today} />

      <InfoBar>
        Los presupuestos corresponden a {monthName} y se actualizan con los gastos registrados en {currency}.
      </InfoBar>

      {/* KnowFinanzas.html layout — entity-grid of budget cards. */}
      <EntityGrid>
        {budgets.map((budget) => {
          const usage = Number(budget.usagePercent);
          const over = Number(budget.remaining) < 0;
          return (
            <EntityCard
              key={budget.budgetId}
              icon={<WalletIcon />}
              topAction={
                <Link
                  href={`/budgets/${budget.budgetId}`}
                  aria-label={`Editar ${budget.categoryName}`}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground"
                >
                  <PencilIcon className="size-3.5" />
                </Link>
              }
              name={budget.categoryName}
              meta={`Presupuesto mensual · ${budget.currencyCode}`}
              footer={
                <span>
                  {over ? "Excedido en " : "Disponible "}
                  {fmt(Math.abs(Number(budget.remaining)), budget.currencyCode)}
                </span>
              }
            >
              <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
                <MoneyAmount amount={budget.spent} currency={budget.currencyCode} variant="compact" className="text-metric font-bold text-foreground" />
                <span className="text-caption text-muted-foreground">de {fmt(budget.limit, budget.currencyCode)}</span>
              </div>
              <ProgressBar
                value={usage}
                state={budget.status === "EXCEEDED" ? "exceeded" : budget.status === "NEAR_LIMIT" ? "warning" : "normal"}
                className="mt-4"
                aria-label={`${Math.round(usage)}% usado`}
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-caption text-muted-foreground">
                <span>{Math.round(usage)}% utilizado</span>
                <strong className={over ? "font-bold text-[var(--negative)]" : "font-bold text-brand"}>
                  {over ? "Límite superado" : "Dentro del plan"}
                </strong>
              </div>
            </EntityCard>
          );
        })}
        <AddEntityCard href="/budgets/new" label="Crear otro presupuesto" />
      </EntityGrid>

      {/* Extra — panorama del mes (no está en el modelo, se conserva). */}
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
        <SectionCard title="Distribución del presupuesto" eyebrow={currency}>
          <DonutChart
            segments={donutSegments}
            centerLabel="Total"
            centerValue={fmt(totalLimit, currency)}
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
  );
}
