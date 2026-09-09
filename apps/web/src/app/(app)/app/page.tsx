import Link from "next/link";
import { ArrowUpIcon, ScaleIcon, WalletIcon } from "lucide-react";

import {
  budgetRepository,
  categoryRepository,
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  goalRepository,
  insightRepository,
  transactionRepository,
  db,
} from "@know-finanzas/db";
import { monthRangeForTimezone, Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { DataFreshnessNote } from "@/components/shared/data-freshness-note";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatDateInTimezone } from "@/lib/date";
import { formatLongDate, formatShortDate, relativeDueLabel } from "@/lib/format";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { getBudgetOverview } from "@/features/dashboard/services/budget-overview";
import { AvailableMoneyDialog } from "@/features/dashboard/components/available-money-dialog";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";

const dashboardService = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity: createActivityQueries(db),
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
});

const budgetQueries = createBudgetQueries(db);

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  DIGITAL_WALLET: "Billetera digital",
  SAVINGS: "Ahorro",
};

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const now = new Date();

  const [summary, budgets, categorySpend, categories, activeGoals, openInsights, uncategorizedCount] = await Promise.all([
    dashboardService.getDashboardSummary({ userId: user.id, timezone: user.timezone, now }),
    getBudgetOverview(user, { budgets: budgetRepository, categories: categoryRepository, budgetQueries }, now),
    (() => {
      const today = todayInTimezone(now, user.timezone);
      const [year, month] = today.split("-").map(Number);
      const range = monthRangeForTimezone(year, month, user.timezone);
      return budgetQueries.getCategorySpendingForUser(user.id, { from: range.start, to: range.end });
    })(),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
    // spec 01 §15 — hasta 3 metas activas, ya ordenadas por fecha objetivo (§15.3).
    goalRepository.listForUser(user.id).catch(() => []),
    // spec 01 §16 — hasta 2 insights ya detectados (sin re-correr el motor en cada render).
    insightRepository.listOpenForUser(user.id).catch(() => []),
    transactionRepository.countUncategorizedForUser(user.id).catch(() => 0),
  ]);

  // spec 01 §7.2 / §17 — hasta cuándo hay datos.
  const lastActivity = summary.recentActivity[0] as { occurredAt?: Date | string } | undefined;
  const lastMovementDate = lastActivity?.occurredAt
    ? formatDateInTimezone(new Date(lastActivity.occurredAt), user.timezone)
    : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Resumen"
        description={`Tu situación financiera al ${formatLongDate(summary.today)}.`}
        actions={
          <>
            <HeaderActions />
            <QuickAddButton>Registrar</QuickAddButton>
          </>
        }
      />

      {summary.accounts.length > 0 ? (
        <DataFreshnessNote lastMovementDate={lastMovementDate} todayISO={summary.today} uncategorizedCount={uncategorizedCount} />
      ) : null}

      {summary.accounts.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="Empezá creando tu primera cuenta"
          description="Cuando registres una cuenta vas a ver tu posición real y su proyección a 30 días."
          action={<Button render={<Link href="/accounts/new">Crear cuenta</Link>} />}
        />
      ) : (
        <DashboardBody
          summary={summary}
          budgets={budgets}
          categorySpend={categorySpend}
          categories={categories}
          goals={activeGoals}
          insights={openInsights}
          baseCurrency={user.baseCurrency}
        />
      )}
    </div>
  );
}

type Summary = Awaited<ReturnType<typeof dashboardService.getDashboardSummary>>;
type BudgetItem = Awaited<ReturnType<typeof getBudgetOverview>>[number];
type CategorySpendRow = Awaited<ReturnType<typeof budgetQueries.getCategorySpendingForUser>>[number];
type CategoryRow = Awaited<ReturnType<typeof categoryRepository.listForUser>>[number];
type GoalRow = Awaited<ReturnType<typeof goalRepository.listForUser>>[number];
type InsightRow = Awaited<ReturnType<typeof insightRepository.listOpenForUser>>[number];

function DashboardBody({
  summary,
  budgets,
  categorySpend,
  categories,
  goals,
  insights,
  baseCurrency,
}: {
  summary: Summary;
  budgets: BudgetItem[];
  categorySpend: CategorySpendRow[];
  categories: CategoryRow[];
  goals: GoalRow[];
  insights: InsightRow[];
  baseCurrency: string;
}) {
  // §8.3/RF-03/D-09: never sum currencies implicitly. `currency` drives the
  // headline KPIs; any other currency the user holds is surfaced separately
  // below, never merged into it.
  const currency = summary.liquidBalances.some((b) => b.currencyCode === baseCurrency)
    ? baseCurrency
    : (summary.liquidBalances[0]?.currencyCode ?? baseCurrency);
  const otherCurrencyBalances = summary.liquidBalances.filter((b) => b.currencyCode !== currency && Number(b.total) !== 0);
  const projection = summary.projections.find((p) => p.currencyCode === currency) ?? summary.projections[0];

  const liquidTotal = summary.liquidBalances.find((b) => b.currencyCode === currency)?.total ?? "0";

  const primaryMonthly = summary.monthly.find((m) => m.currencyCode === currency);
  const periodIncome = primaryMonthly?.income ?? "0";
  const periodExpense = primaryMonthly?.expense ?? "0";
  const periodResult = Money.fromString(periodIncome, currency).subtract(Money.fromString(periodExpense, currency)).toString();

  const upcoming = summary.upcomingObligations.filter((o) => o.currencyCode === currency);
  const obligationsTotal = upcoming
    .reduce((sum, o) => sum.add(Money.fromString(o.amount, currency)), Money.zero(currency))
    .toString();

  // Spending donut — top 5 categories + "Otros", controlled blue/neutral palette (no rainbow).
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const spendRows = categorySpend
    .filter((row) => row.currencyCode === currency && Number(row.netExpense) > 0)
    .map((row) => ({ name: (row.categoryId && categoryName.get(row.categoryId)) || "Sin categoría", value: Number(row.netExpense) }))
    .sort((a, b) => b.value - a.value);
  const totalSpend = spendRows.reduce((sum, r) => sum + r.value, 0);
  const topSpend = spendRows.slice(0, 5);
  const otherSpend = spendRows.slice(5).reduce((sum, r) => sum + r.value, 0);
  const donutSegments: DonutSegment[] = [
    ...topSpend.map((row, i) => ({ label: row.name, value: row.value, color: DONUT_COLORS[i] })),
    ...(otherSpend > 0 ? [{ label: "Otros", value: otherSpend, color: "var(--muted-foreground)" }] : []),
  ];

  const cashflowPoints = (projection?.cashflow.points ?? []).map((point) => ({
    date: point.date,
    label: formatShortDate(point.date),
    balance: Number(point.projectedBalance.toString()),
  }));

  const budgetSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const budgetLimit = budgets.reduce((sum, b) => sum + Number(b.limit), 0);
  const budgetPct = budgetLimit > 0 ? (budgetSpent / budgetLimit) * 100 : 0;
  const budgetState = budgetPct >= 100 ? "exceeded" : budgetPct >= 80 ? "warning" : "normal";

  // §15 — máximo 3 metas, ya vienen ordenadas por fecha objetivo (§15.3).
  const topGoals = goals.slice(0, 3).map((goal) => {
    const target = Number(goal.targetAmount);
    return {
      id: goal.id,
      name: goal.name,
      current: goal.currentAmount,
      target: goal.targetAmount,
      currency: goal.currencyCode,
      percent: target > 0 ? Math.min(100, Math.round((Number(goal.currentAmount) / target) * 100)) : 0,
    };
  });

  // §16 — 2 insights visibles como máximo, los más recientes.
  const topInsights = [...insights]
    .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI row — spec 01 §8-10: exactly 3 KPIs primarios (§6.2 regla de densidad). */}
      <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo total"
          icon={WalletIcon}
          value={liquidTotal}
          currency={currency}
          hint={`${summary.accounts.length} ${summary.accounts.length === 1 ? "cuenta" : "cuentas"}`}
          info="Suma de los saldos confirmados de tus cuentas en esta moneda. No incluye ingresos futuros."
        />
        <StatCard
          label="Dinero disponible"
          icon={ArrowUpIcon}
          tone="positive"
          value={projection?.spendable.spendable.toString() ?? liquidTotal}
          currency={currency}
          hint={
            projection ? (
              <AvailableMoneyDialog
                currency={currency}
                liquidBalance={projection.spendable.liquidBalance.toString()}
                committedObligations={projection.spendable.committedObligations.toString()}
                spendable={projection.spendable.spendable.toString()}
                horizonEnd={projection.spendable.horizonEnd}
                commitments={projection.spendable.commitments.map((item) => ({
                  sourceId: item.sourceId,
                  title: item.title,
                  dueDate: item.dueDate,
                  amount: item.remainingAmount.toString(),
                  isOverdue: item.isOverdue ?? false,
                }))}
              />
            ) : undefined
          }
          info="Saldo líquido menos las obligaciones comprometidas de los próximos 30 días. No incluye ingresos futuros."
        />
        <StatCard
          label="Resultado del período"
          icon={ScaleIcon}
          tone={Number(periodResult) >= 0 ? "positive" : "neutral"}
          value={periodResult}
          currency={currency}
          hint={
            <>
              Ingresos <MoneyAmount amount={periodIncome} currency={currency} variant="compact" className="font-medium text-foreground" /> · Gastos{" "}
              <MoneyAmount amount={periodExpense} currency={currency} variant="compact" className="font-medium text-foreground" />
            </>
          }
          info="Ingresos menos gastos confirmados del período. Excluye transferencias entre tus propias cuentas."
        />
      </section>

      {/* §8.3 / RF-03 — otras monedas: se muestran con su propio saldo y disponible (también se
          gastan), nunca sumadas a los KPIs de arriba. */}
      {otherCurrencyBalances.length > 0 ? (
        <section aria-label="Otras monedas" className="flex flex-col gap-2">
          <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Otras monedas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {otherCurrencyBalances.map((balance) => {
              const proj = summary.projections.find((p) => p.currencyCode === balance.currencyCode);
              return (
                <div key={balance.currencyCode} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">{balance.currencyCode}</p>
                  <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-small">
                    <div className="flex flex-col">
                      <dt className="text-caption text-muted-foreground">Saldo total</dt>
                      <dd><MoneyAmount amount={balance.total} currency={balance.currencyCode} variant="compact" className="text-body-lg font-medium text-foreground" /></dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-caption text-muted-foreground">Dinero disponible</dt>
                      <dd>
                        <MoneyAmount
                          amount={proj?.spendable.spendable.toString() ?? balance.total}
                          currency={balance.currencyCode}
                          variant="compact"
                          tone="positive"
                          className="text-body-lg font-medium"
                        />
                      </dd>
                    </div>
                  </dl>
                  <Link href="/accounts" className="mt-2 inline-block text-caption font-medium text-brand hover:underline">
                    Ver cuentas en {balance.currencyCode}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* spec 01 §11.6 — riesgo de saldo negativo. Descriptivo, con acceso al cálculo; sin alarmismo. */}
      {projection?.cashflow.firstNegativeDate ? (
        <p role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-warning-soft px-3 py-2.5 text-small text-[var(--warning)]">
          <span>
            Con los compromisos registrados, tu saldo proyectado en {currency} podría quedar en{" "}
            <MoneyAmount amount={projection.cashflow.minimumProjectedBalance.toString()} currency={currency} variant="compact" /> el{" "}
            {formatLongDate(projection.cashflow.minimumBalanceDate)}.
          </span>
          <Link href="/reports/cash-flow" className="font-medium underline">
            Ver el cálculo
          </Link>
        </p>
      ) : null}

      {/* Analytical row — §17.1 */}
      <section aria-label="Proyección y gastos" className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SectionCard
          eyebrow="Proyección · próximos 30 días"
          title="Flujo de caja proyectado"
          info="Estimación del saldo día a día combinando tu saldo actual, obligaciones y movimientos programados."
        >
          <div className="flex flex-col gap-1">
            <MoneyAmount
              amount={projection?.cashflow.projectedEndBalance.toString() ?? liquidTotal}
              currency={currency}
              className="text-metric-xl font-medium text-foreground"
            />
            <span className="text-small text-muted-foreground">Balance proyectado a fin de período</span>
          </div>
          <CashflowChart points={cashflowPoints} todayIndex={0} />
        </SectionCard>

        <SectionCard
          eyebrow="Este mes"
          title="Distribución de gastos"
          action={{ label: "Ver categorías", href: "/reports" }}
        >
          {donutSegments.length > 0 ? (
            <DonutChart
              segments={donutSegments}
              centerLabel="Total gastado"
              centerValue={new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(totalSpend)}
            />
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">Todavía no hay gastos categorizados este mes.</p>
          )}
        </SectionCard>
      </section>

      {/* Supporting row — §17.1 */}
      <section aria-label="Cuentas, obligaciones y presupuesto" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Cuentas" action={{ label: "Ver todas", href: "/accounts" }}>
          <ul className="flex flex-col divide-y divide-border">
            {summary.accounts.slice(0, 5).map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-small font-medium text-foreground">{account.name}</span>
                  <span className="text-caption text-muted-foreground">{ACCOUNT_TYPE_LABEL[account.type] ?? account.type}</span>
                </span>
                <MoneyAmount
                  amount={account.balance}
                  currency={account.currencyCode}
                  variant="compact"
                  tone={Number(account.balance) < 0 ? "negative" : "neutral"}
                  className="shrink-0 text-small font-medium"
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Obligaciones próximas"
          eyebrow={upcoming.length > 0 ? `${new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(obligationsTotal))} en 30 días` : undefined}
          action={{ label: "Ver todas las obligaciones", href: "/obligations" }}
        >
          {upcoming.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {upcoming.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-small font-medium text-foreground">{item.title}</span>
                    <span className="text-caption text-muted-foreground">
                      {formatShortDate(item.dueDate)} · {relativeDueLabel(item.dueDate, summary.today)}
                    </span>
                  </span>
                  <MoneyAmount amount={item.amount} currency={item.currencyCode} variant="compact" className="shrink-0 text-small font-medium" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">No tenés obligaciones en los próximos 30 días.</p>
          )}
        </SectionCard>

        <SectionCard title="Presupuesto del mes" action={budgets.length > 0 ? { label: "Editar", href: "/budgets" } : undefined}>
          {budgets.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <MoneyAmount amount={String(budgetSpent)} currency={currency} variant="compact" className="text-metric font-medium text-foreground" />
                  <span className="text-small text-muted-foreground">
                    de <MoneyAmount amount={String(budgetLimit)} currency={currency} variant="compact" className="text-small text-muted-foreground" />
                  </span>
                </div>
                <ProgressBar value={budgetPct} state={budgetState} aria-label={`${Math.round(budgetPct)}% del presupuesto usado`} />
                <span className="text-caption text-muted-foreground">{Math.round(budgetPct)}% usado</span>
              </div>
              <InsightCard title={budgetState === "normal" ? "Vas bien" : "Atención al gasto"}>
                <p>
                  {budgetState === "normal"
                    ? `Te queda ${Math.max(0, 100 - Math.round(budgetPct))}% disponible de tu presupuesto mensual.`
                    : "Estás cerca o por encima de tu límite. Revisá las categorías con más gasto."}
                </p>
              </InsightCard>
            </div>
          ) : (
            <EmptyState
              title="Sin presupuestos"
              description="Definí cuánto querés gastar por categoría y seguí tu avance."
              action={<Button variant="outline" render={<Link href="/budgets/new">Nuevo presupuesto</Link>} />}
            />
          )}
        </SectionCard>
      </section>

      {/* Goals + insights row — spec 01 §15 / §16 */}
      <section aria-label="Metas y observaciones" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Metas" action={topGoals.length > 0 ? { label: "Ver todas", href: "/goals" } : undefined}>
          {topGoals.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {topGoals.map((goal) => (
                <li key={goal.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/goals/${goal.id}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                      {goal.name}
                    </Link>
                    <span className="shrink-0 text-caption tabular-nums text-muted-foreground">{goal.percent}%</span>
                  </div>
                  <ProgressBar value={goal.percent} aria-label={`${goal.name}: ${goal.percent}%`} />
                  <span className="text-caption text-muted-foreground">
                    <MoneyAmount amount={goal.current} currency={goal.currency} variant="compact" /> de{" "}
                    <MoneyAmount amount={goal.target} currency={goal.currency} variant="compact" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Sin metas"
              description="Convertí un objetivo de ahorro en un plan medible."
              action={<Button variant="outline" render={<Link href="/goals/new">Crear meta</Link>} />}
            />
          )}
        </SectionCard>

        <SectionCard title="Para vos" action={insights.length > 0 ? { label: "Ver todos los insights", href: "/insights" } : undefined}>
          {topInsights.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {topInsights.map((insight) => (
                <li key={insight.id}>
                  <InsightCard title={insight.title} action={{ label: "Ver detalle", href: `/insights/${insight.id}` }}>
                    <p>{insight.body}</p>
                  </InsightCard>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">
              Cuando detectemos un cambio de gasto, un presupuesto al límite o una meta atrasada con evidencia suficiente, lo vas a ver acá.
            </p>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
