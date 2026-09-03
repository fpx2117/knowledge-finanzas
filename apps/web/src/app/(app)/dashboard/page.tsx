import Link from "next/link";
import { ArrowUpIcon, CalendarClockIcon, PiggyBankIcon, WalletIcon } from "lucide-react";

import {
  budgetRepository,
  categoryRepository,
  createAccountBalanceQueries,
  createActivityQueries,
  createBudgetQueries,
  createDebtSummaryQueries,
  createMonthlySummaryQueries,
  createUpcomingObligationQueries,
  db,
} from "@know-finanzas/db";
import { monthRangeForTimezone, Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
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
import { formatShortDate, relativeDueLabel } from "@/lib/format";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { getBudgetOverview } from "@/features/dashboard/services/budget-overview";

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

  const [summary, budgets, categorySpend, categories] = await Promise.all([
    dashboardService.getDashboardSummary({ userId: user.id, timezone: user.timezone, now }),
    getBudgetOverview(user, { budgets: budgetRepository, categories: categoryRepository, budgetQueries }, now),
    (() => {
      const today = todayInTimezone(now, user.timezone);
      const [year, month] = today.split("-").map(Number);
      const range = monthRangeForTimezone(year, month, user.timezone);
      return budgetQueries.getCategorySpendingForUser(user.id, { from: range.start, to: range.end });
    })(),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
  ]);

  const firstName = user.name?.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Tu resumen financiero"}
        description="Lo que tenés, lo que movés y lo que viene en los próximos 30 días."
        actions={
          <>
            <HeaderActions />
            <Button render={<Link href="/transactions/new?type=EXPENSE">Registrar movimiento</Link>} />
          </>
        }
      />

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

function DashboardBody({
  summary,
  budgets,
  categorySpend,
  categories,
  baseCurrency,
}: {
  summary: Summary;
  budgets: BudgetItem[];
  categorySpend: CategorySpendRow[];
  categories: CategoryRow[];
  baseCurrency: string;
}) {
  const currency = summary.liquidBalances[0]?.currencyCode ?? baseCurrency;
  const projection = summary.projections.find((p) => p.currencyCode === currency) ?? summary.projections[0];

  const liquidTotal = summary.liquidBalances.find((b) => b.currencyCode === currency)?.total ?? "0";
  const debtTotal = summary.debt.find((d) => d.currencyCode === currency)?.remaining ?? "0";
  const netWorth = Money.fromString(liquidTotal, currency).subtract(Money.fromString(debtTotal, currency)).toString();

  const upcoming = summary.upcomingObligations.filter((o) => o.currencyCode === currency);
  const obligationsTotal = upcoming
    .reduce((sum, o) => sum.add(Money.fromString(o.amount, currency)), Money.zero(currency))
    .toString();
  const nextDue = upcoming[0];

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

  return (
    <div className="flex flex-col gap-8">
      {/* KPI row — §11 */}
      <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patrimonio neto"
          icon={WalletIcon}
          value={netWorth}
          currency={currency}
          hint="Tus activos menos tus deudas"
          info="La suma de lo que tenés en tus cuentas menos el saldo pendiente de tus obligaciones."
        />
        <StatCard
          label="Dinero disponible"
          icon={ArrowUpIcon}
          tone="positive"
          value={projection?.spendable.spendable.toString() ?? "0"}
          currency={currency}
          hint="Después de los compromisos de 30 días"
          info="Saldo líquido menos las obligaciones comprometidas de los próximos 30 días. No incluye ingresos futuros."
        />
        <StatCard
          label="Obligaciones pendientes"
          icon={PiggyBankIcon}
          tone="warning"
          value={obligationsTotal}
          currency={currency}
          hint="A pagar en los próximos 30 días"
        />
        <StatCard label="Próximo vencimiento" icon={CalendarClockIcon}>
          {nextDue ? (
            <span className="flex flex-col gap-0.5">
              <span className="truncate text-body-lg font-medium text-foreground">{nextDue.title}</span>
              <span className="text-small font-normal text-muted-foreground">
                {formatShortDate(nextDue.dueDate)} · {relativeDueLabel(nextDue.dueDate, summary.today)}
              </span>
            </span>
          ) : (
            <span className="text-body-lg font-medium text-muted-foreground">Sin vencimientos</span>
          )}
        </StatCard>
      </section>

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

        <SectionCard title="Obligaciones próximas" action={{ label: "Ver calendario", href: "/calendar" }}>
          {upcoming.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {upcoming.slice(0, 5).map((item) => (
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
    </div>
  );
}
