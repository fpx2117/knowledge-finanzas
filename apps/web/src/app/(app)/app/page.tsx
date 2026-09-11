import Link from "next/link";
import {
  ArrowDownLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CoinsIcon,
  CreditCardIcon,
  LightbulbIcon,
  PieChartIcon,
  PiggyBankIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react";

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
  merchantRepository,
  transactionRepository,
  db,
} from "@know-finanzas/db";
import { convertAmount, isConvertiblePair, monthRangeForTimezone, Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { CurrencyFlag } from "@/components/financial/currency-flag";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate, formatShortDate, relativeDueLabel } from "@/lib/format";
import { createDashboardService } from "@/features/dashboard/services/dashboard-service";
import { getBudgetOverview } from "@/features/dashboard/services/budget-overview";
import { AvailableMoneyDialog } from "@/features/dashboard/components/available-money-dialog";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";
import { BalanceHeroCard } from "@/features/dashboard/components/balance-hero-card";
import { KpiCard, type KpiDelta } from "@/features/dashboard/components/kpi-card";
import { WeeklyFlowChart } from "@/features/dashboard/components/weekly-flow-chart";
import { TransactionListItem, type TxnKind } from "@/components/financial/transaction-list-item";
import { MerchantLogo } from "@/components/financial/merchant-logo";
import { getBlueQuote } from "@/features/fx/services/fx-service";

const dashboardService = createDashboardService({
  balances: createAccountBalanceQueries(db),
  monthly: createMonthlySummaryQueries(db),
  activity: createActivityQueries(db),
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
});

const budgetQueries = createBudgetQueries(db);
const monthlyQueries = createMonthlySummaryQueries(db);
const upcomingQueries = createUpcomingObligationQueries(db);

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--success-vivid)", "var(--warning-vivid)", "var(--chart-5)"];
const CURRENCY_NAME: Record<string, string> = {
  ARS: "Pesos argentinos",
  USD: "Dólares",
  EUR: "Euros",
  BRL: "Reales",
  UYU: "Pesos uruguayos",
  CLP: "Pesos chilenos",
  GBP: "Libras",
  MXN: "Pesos mexicanos",
};
const MONTH_NAME = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" });

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function deltaPct(current: number, previous: number, comparedTo: string): KpiDelta {
  if (!Number.isFinite(previous) || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (!Number.isFinite(pct)) return null;
  return { pct: Math.round(pct * 10) / 10, comparedTo };
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const now = new Date();
  const today = todayInTimezone(now, user.timezone);
  const [ty, tm] = today.split("-").map(Number);
  const thisRange = monthRangeForTimezone(ty, tm, user.timezone);
  const prevY = tm === 1 ? ty - 1 : ty;
  const prevM = tm === 1 ? 12 : tm - 1;
  const prevRange = monthRangeForTimezone(prevY, prevM, user.timezone);

  const [
    summary,
    budgets,
    categorySpend,
    categories,
    activeGoals,
    openInsights,
    blueQuote,
    prevMonthly,
    monthTxns,
    scheduledUpcoming,
  ] = await Promise.all([
    dashboardService.getDashboardSummary({ userId: user.id, timezone: user.timezone, now }),
    getBudgetOverview(user, { budgets: budgetRepository, categories: categoryRepository, budgetQueries }, now),
    budgetQueries.getCategorySpendingForUser(user.id, { from: thisRange.start, to: thisRange.end }),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
    goalRepository.listForUser(user.id).catch(() => []),
    insightRepository.listOpenForUser(user.id).catch(() => []),
    getBlueQuote().catch(() => null),
    monthlyQueries.getMonthlyIncomeExpense(user.id, { from: prevRange.start, to: prevRange.end }).catch(() => []),
    transactionRepository.listForUser(user.id, { from: thisRange.start, to: thisRange.end, limit: 1000 }).catch(() => []),
    upcomingQueries.listScheduledForUser(user.id, { from: today, to: addDaysISO(today, 30) }).catch(() => []),
  ]);

  // Recent movements + their merchant logos.
  const recentRows = (summary.recentActivity as RecentActivityRow[]).slice(0, 6);
  const recentMerchants = await merchantRepository.identitiesByIds(
    recentRows.map((row) => row.merchantId).filter((id): id is string => Boolean(id)),
  );
  const recentMovements: RecentMovement[] = recentRows.map((row) => {
    const identity = row.merchantId ? recentMerchants.get(row.merchantId) : undefined;
    const merchantName = identity?.canonicalName ?? row.merchant ?? null;
    return {
      id: row.id,
      type: row.type,
      amount: String(row.amount),
      currencyCode: row.currencyCode,
      concept: merchantName ?? row.description,
      merchantName,
      merchantDomain: identity?.domain ?? null,
      categoryName: row.categoryName,
      accountName: row.accountName,
      occurredAt: row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resumen"
        description={`Tu situación financiera al ${formatLongDate(summary.today)}.`}
        actions={
          <>
            <HeaderActions />
            {/* En mobile "Registrar" ya vive en la barra inferior — sólo se muestra en desktop. */}
            <span className="hidden sm:contents">
              <QuickAddButton>Registrar</QuickAddButton>
            </span>
          </>
        }
      />

      {summary.accounts.length === 0 ? (
        <EmptyState
          size="section"
          icon={<WalletIcon />}
          title="Empezá creando tu primera cuenta"
          description="Cuando registres una cuenta vas a ver tu patrimonio, tu resultado del mes y qué pagos tenés cerca."
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
          blueQuote={blueQuote}
          prevMonthly={prevMonthly}
          monthTxns={monthTxns as MonthTxn[]}
          scheduledUpcoming={scheduledUpcoming as ScheduledRow[]}
          recentMovements={recentMovements}
          monthLabel={MONTH_NAME.format(new Date(Date.UTC(ty, tm - 1, 1)))}
          prevMonthLabel={MONTH_NAME.format(new Date(Date.UTC(prevY, prevM - 1, 1)))}
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
type MonthlyRow = { currencyCode: string; incomeTotal: string; expenseTotal: string; netExpense?: string };
type MonthTxn = { occurredAt: string | Date; type: string; amount: string; currencyCode: string };
type ScheduledRow = { id: string; scheduledDate: string; type: string; expectedAmount: string; currencyCode: string; description: string };
type RecentActivityRow = {
  id: string;
  type: string;
  amount: string;
  currencyCode: string;
  description: string;
  merchant: string | null;
  merchantId: string | null;
  categoryName: string | null;
  accountName: string;
  occurredAt: string | Date;
};
type RecentMovement = {
  id: string;
  type: string;
  amount: string;
  currencyCode: string;
  concept: string;
  merchantName: string | null;
  merchantDomain: string | null;
  categoryName: string | null;
  accountName: string;
  occurredAt: string;
};

const CURRENCY_FMT_CACHE = new Map<string, Intl.NumberFormat>();
function money0(currency: string) {
  let f = CURRENCY_FMT_CACHE.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 });
    CURRENCY_FMT_CACHE.set(currency, f);
  }
  return f;
}

function DashboardBody({
  summary,
  budgets,
  categorySpend,
  categories,
  goals,
  insights,
  baseCurrency,
  blueQuote,
  prevMonthly,
  monthTxns,
  scheduledUpcoming,
  recentMovements,
  monthLabel,
  prevMonthLabel,
}: {
  summary: Summary;
  budgets: BudgetItem[];
  categorySpend: CategorySpendRow[];
  categories: CategoryRow[];
  goals: GoalRow[];
  insights: InsightRow[];
  baseCurrency: string;
  blueQuote: Awaited<ReturnType<typeof getBlueQuote>>;
  prevMonthly: MonthlyRow[];
  monthTxns: MonthTxn[];
  scheduledUpcoming: ScheduledRow[];
  recentMovements: RecentMovement[];
  monthLabel: string;
  prevMonthLabel: string;
}) {
  // Primary currency — never merges currencies (§8.3 / RF-03).
  const currency = summary.liquidBalances.some((b) => b.currencyCode === baseCurrency)
    ? baseCurrency
    : (summary.liquidBalances[0]?.currencyCode ?? baseCurrency);
  const otherCurrencyBalances = summary.liquidBalances.filter((b) => b.currencyCode !== currency && Number(b.total) !== 0);
  const projection = summary.projections.find((p) => p.currencyCode === currency) ?? summary.projections[0];

  const liquidTotal = summary.liquidBalances.find((b) => b.currencyCode === currency)?.total ?? "0";
  const spendable = projection?.spendable.spendable.toString() ?? liquidTotal;
  const committed = projection?.spendable.committedObligations.toString() ?? "0";

  // Monthly result + month-over-month deltas.
  const primaryMonthly = summary.monthly.find((m) => m.currencyCode === currency);
  const periodIncome = primaryMonthly?.income ?? "0";
  const periodExpense = primaryMonthly?.expense ?? "0";
  const periodResult = Money.fromString(periodIncome, currency).subtract(Money.fromString(periodExpense, currency)).toString();

  const prev = prevMonthly.find((m) => m.currencyCode === currency);
  const prevIncome = Number(prev?.incomeTotal ?? 0);
  const prevExpense = Number(prev?.netExpense ?? prev?.expenseTotal ?? 0);
  const prevResult = prevIncome - prevExpense;

  const resultDelta = deltaPct(Number(periodResult), prevResult, prevMonthLabel);
  const expenseDelta = deltaPct(Number(periodExpense), prevExpense, prevMonthLabel);

  const upcoming = summary.upcomingObligations.filter((o) => o.currencyCode === currency);
  const obligationsTotal = upcoming.reduce((s, o) => s.add(Money.fromString(o.amount, currency)), Money.zero(currency)).toString();

  // Consolidated (blue) — an explicit estimate, never merged into the KPIs above.
  const consolidated = blueQuote
    ? (() => {
        const parts = otherCurrencyBalances.filter((b) => isConvertiblePair(b.currencyCode, currency, blueQuote.fx));
        if (parts.length === 0) return null;
        let total = Money.fromString(liquidTotal, currency);
        for (const b of parts) {
          total = total.add(Money.fromString(convertAmount(b.total, b.currencyCode, currency, blueQuote.fx), currency));
        }
        return { total: total.toString(), currencies: parts.map((p) => p.currencyCode), stale: blueQuote.stale };
      })()
    : null;

  // "Flujo del mes" — weekly buckets from this month's transactions.
  const weeks = buildWeeks(monthTxns, currency);

  // "Gastos por categoría" donut.
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const spendRows = categorySpend
    .filter((r) => r.currencyCode === currency && Number(r.netExpense) > 0)
    .map((r) => ({ name: (r.categoryId && categoryName.get(r.categoryId)) || "Sin categoría", value: Number(r.netExpense) }))
    .sort((a, b) => b.value - a.value);
  const totalSpend = spendRows.reduce((s, r) => s + r.value, 0);
  const otherSpend = spendRows.slice(5).reduce((s, r) => s + r.value, 0);
  const donutSegments: DonutSegment[] = [
    ...spendRows.slice(0, 5).map((r, i) => ({ label: r.name, value: r.value, color: DONUT_COLORS[i], display: money0(currency).format(r.value) })),
    ...(otherSpend > 0 ? [{ label: "Otros", value: otherSpend, color: "var(--muted-foreground)", display: money0(currency).format(otherSpend) }] : []),
  ];

  // "Próximos movimientos" — debt installments + scheduled transactions, merged & sorted.
  type UpcomingItem = { id: string; title: string; subtitle: string; date: string; amount: string; currencyCode: string; href: string; inflow: boolean };
  const upcomingItems: UpcomingItem[] = [
    ...summary.upcomingObligations.map((o) => ({
      id: `debt-${o.id}`,
      title: o.title,
      subtitle: o.isOverdue ? "Cuota vencida" : "Cuota",
      date: o.dueDate,
      amount: o.amount,
      currencyCode: o.currencyCode,
      href: "/obligations",
      inflow: false,
    })),
    ...scheduledUpcoming.map((s) => ({
      id: `sched-${s.id}`,
      title: s.description || (s.type === "INCOME" ? "Ingreso programado" : "Pago programado"),
      subtitle: s.type === "INCOME" ? "Ingreso programado" : "Pago programado",
      date: s.scheduledDate,
      amount: s.expectedAmount,
      currencyCode: s.currencyCode,
      href: "/obligations",
      inflow: s.type === "INCOME",
    })),
  ]
    .filter((i) => i.currencyCode === currency)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // "Tus cuentas y monedas".
  const accountsPerCurrency = new Map<string, number>();
  for (const a of summary.accounts) accountsPerCurrency.set(a.currencyCode, (accountsPerCurrency.get(a.currencyCode) ?? 0) + 1);
  const currencyRows = [...summary.liquidBalances]
    .sort((a, b) => (a.currencyCode === currency ? -1 : b.currencyCode === currency ? 1 : Number(b.total) - Number(a.total)))
    .map((b) => ({
      code: b.currencyCode,
      total: b.total,
      count: accountsPerCurrency.get(b.currencyCode) ?? 0,
      approx:
        b.currencyCode !== currency && blueQuote && isConvertiblePair(b.currencyCode, currency, blueQuote.fx)
          ? convertAmount(b.total, b.currencyCode, currency, blueQuote.fx)
          : null,
    }));

  // Extras kept below the mock layout.
  const budgetSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const budgetLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const budgetPct = budgetLimit > 0 ? (budgetSpent / budgetLimit) * 100 : 0;
  const budgetState = budgetPct >= 100 ? "exceeded" : budgetPct >= 80 ? "warning" : "normal";
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
  const heroInsight = [...insights].sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())[0];

  return (
    <div className="flex flex-col gap-6">
      <BalanceHeroCard
        total={liquidTotal}
        currency={currency}
        spendable={spendable}
        committed={committed}
        accountCount={summary.accounts.length}
        monthResult={periodResult}
        monthLabel={monthLabel}
      />

      {/* KPI row — 4 cards, reference mock: 2×2 on mobile, 4-across on wide screens. */}
      <section aria-label="Indicadores principales" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Disponible"
          icon={WalletIcon}
          tone="positive"
          value={spendable}
          currency={currency}
          info="Saldo líquido menos las obligaciones comprometidas de los próximos 30 días. No incluye ingresos futuros."
          hint="Para gastar este período"
        />
        <KpiCard
          label="Resultado del mes"
          icon={BarChart3Icon}
          tone="brand"
          value={periodResult}
          currency={currency}
          info="Ingresos menos gastos confirmados del período. Excluye transferencias entre tus cuentas."
          delta={resultDelta}
          hint={`En ${monthLabel}`}
        />
        <KpiCard
          label="Gastos del mes"
          icon={CreditCardIcon}
          tone="negative"
          value={periodExpense}
          currency={currency}
          info="Gastos confirmados del período, neto de reembolsos."
          delta={expenseDelta}
          hint={`En ${monthLabel}`}
        />
        <KpiCard
          label="Próximos pagos"
          icon={CalendarClockIcon}
          tone="warning"
          value={obligationsTotal}
          currency={currency}
          hint={`${upcoming.length} ${upcoming.length === 1 ? "obligación en 30 días" : "obligaciones en 30 días"}`}
        />
      </section>

      {/* Charts row — 2-up from the smallest screens (reference mock). */}
      <section aria-label="Flujo y distribución" className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <SectionCard
          compact
          icon={BarChart3Icon}
          title="Flujo del mes"
          subtitle="Ingresos y gastos por semana"
          expand={
            weeks.some((w) => w.income > 0 || w.expense > 0) ? (
              <WeeklyFlowChart weeks={weeks} currency={currency} expanded />
            ) : undefined
          }
        >
          {weeks.some((w) => w.income > 0 || w.expense > 0) ? (
            <WeeklyFlowChart weeks={weeks} currency={currency} />
          ) : (
            <p className="py-8 text-center text-caption text-muted-foreground">Todavía no hay movimientos este mes.</p>
          )}
        </SectionCard>
        <SectionCard
          compact
          icon={PieChartIcon}
          title="Gastos por categoría"
          contentClassName="flex-1"
          expand={
            donutSegments.length > 0 ? (
              <DonutChart segments={donutSegments} centerLabel="Gasto total" centerValue={money0(currency).format(totalSpend)} expanded />
            ) : undefined
          }
        >
          {/* flex-1 on CardContent (above) lets this row take the leftover height when the
              sibling "Flujo del mes" card is taller, so the donut centers instead of hugging
              the top with blank space below it. */}
          <div className="flex flex-1 items-center">
            {donutSegments.length > 0 ? (
              <DonutChart
                segments={donutSegments}
                centerLabel="Gasto total"
                centerValue={money0(currency).format(totalSpend)}
                className="w-full"
              />
            ) : (
              <p className="w-full py-8 text-center text-caption text-muted-foreground">Todavía no hay gastos categorizados este mes.</p>
            )}
          </div>
        </SectionCard>
      </section>

      {/* Recent movements — with merchant logos (logo.dev). */}
      <SectionCard
        icon={ArrowRightIcon}
        title="Movimientos recientes"
        action={{ label: "Ver todos", href: "/transactions" }}
      >
        {recentMovements.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border-subtle">
            {recentMovements.map((row) => (
              <li key={row.id}>
                <Link href={`/transactions/${row.id}`} className="-mx-2 block rounded-lg px-2 transition-colors hover:bg-brand-subtle/40">
                  <TransactionListItem
                    concept={row.concept}
                    meta={`${row.categoryName ?? "Sin categoría"} · ${row.accountName}`}
                    amount={row.amount}
                    currency={row.currencyCode}
                    kind={recentKind(row.type)}
                    leading={row.merchantName ? <MerchantLogo name={row.merchantName} domain={row.merchantDomain} /> : undefined}
                    date={`${formatShortDate(row.occurredAt)} · ${row.currencyCode}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-caption text-muted-foreground">Todavía no registraste movimientos.</p>
        )}
      </SectionCard>

      {/* Lists row. */}
      <section aria-label="Próximos movimientos y cuentas" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={CalendarClockIcon} title="Próximos movimientos" action={{ label: "Calendario", href: "/calendar" }}>
          {upcomingItems.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {upcomingItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-brand-subtle/40">
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-secondary text-muted-foreground [&_svg]:size-[17px]"
                    >
                      {item.inflow ? <ArrowDownLeftIcon className="text-[var(--success)]" /> : <CreditCardIcon />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-small font-bold text-foreground">{item.title}</span>
                      <span className="truncate text-caption text-muted-foreground">
                        {item.subtitle} · {relativeDueLabel(item.date, summary.today)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <MoneyAmount amount={item.amount} currency={item.currencyCode} variant="compact" className="text-small font-bold" tone={item.inflow ? "positive" : "neutral"} />
                      <span className="mt-0.5 text-[10px] text-muted-foreground">{formatShortDate(item.date)}</span>
                    </span>
                    <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-small text-muted-foreground">No tenés pagos ni obligaciones en los próximos 30 días.</p>
          )}
        </SectionCard>

        <SectionCard icon={CoinsIcon} title="Tus cuentas y monedas" action={{ label: "Ver todas", href: "/accounts" }}>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {currencyRows.map((row) => (
              <li key={row.code}>
                <Link href="/accounts" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-brand-subtle/40">
                  <CurrencyFlag code={row.code} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-small font-bold text-foreground">{CURRENCY_NAME[row.code] ?? row.code}</span>
                    <span className="text-caption text-muted-foreground">
                      {row.count} {row.count === 1 ? "cuenta" : "cuentas"} · {row.code}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <MoneyAmount amount={row.total} currency={row.code} variant="compact" className="text-small font-bold text-foreground" />
                    {row.approx ? (
                      <span className="mt-0.5 text-[10px] text-muted-foreground">≈ {money0(currency).format(Number(row.approx))}</span>
                    ) : null}
                  </span>
                  <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
                </Link>
              </li>
            ))}
          </ul>
          {consolidated ? (
            <p className="mt-1 text-caption text-muted-foreground">
              Todo junto ≈{" "}
              <MoneyAmount amount={consolidated.total} currency={currency} variant="compact" className="font-bold text-foreground" /> — incluye{" "}
              {consolidated.currencies.join(", ")} al dólar blue{consolidated.stale ? ", cotización sin refrescar" : ""}.{" "}
              <Link href="/conversor" className="font-bold text-brand hover:underline">
                Conversor
              </Link>
            </p>
          ) : null}
        </SectionCard>
      </section>

      {/* Insight bar — full width. */}
      {heroInsight ? (
        <Link
          href={`/insights/${heroInsight.id}`}
          className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-subtle px-4 py-3.5 text-small text-foreground-secondary transition-colors hover:bg-brand-subtle/70"
        >
          <LightbulbIcon aria-hidden className="size-4 shrink-0 text-brand" />
          <span className="min-w-0 flex-1">
            <span className="font-bold text-foreground">{heroInsight.title}. </span>
            <span>{heroInsight.body}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 font-bold text-brand sm:flex">
            Ver análisis <ArrowRightIcon className="size-3.5" />
          </span>
        </Link>
      ) : null}

      {/* spec 01 §11.6 — negative-balance risk (kept). */}
      {projection?.cashflow.firstNegativeDate ? (
        <p role="alert" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-warning-soft px-4 py-3 text-small text-[var(--warning)]">
          <span>
            Con los compromisos registrados, tu saldo proyectado en {currency} podría quedar en{" "}
            <MoneyAmount amount={projection.cashflow.minimumProjectedBalance.toString()} currency={currency} variant="compact" /> el{" "}
            {formatLongDate(projection.cashflow.minimumBalanceDate)}.
          </span>
          <Link href="/reports/cash-flow" className="font-bold underline">
            Ver el cálculo
          </Link>
        </p>
      ) : null}

      {/* Extras kept below the reference layout — budget + goals. */}
      <section aria-label="Presupuesto y metas" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={PiggyBankIcon} title="Presupuesto del mes" action={budgets.length > 0 ? { label: "Editar", href: "/budgets" } : undefined}>
          {budgets.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <MoneyAmount amount={String(budgetSpent)} currency={currency} variant="compact" className="text-metric font-bold text-foreground" />
                <span className="text-small text-muted-foreground">
                  de <MoneyAmount amount={String(budgetLimit)} currency={currency} variant="compact" className="text-small text-muted-foreground" />
                </span>
              </div>
              <ProgressBar value={budgetPct} state={budgetState} aria-label={`${Math.round(budgetPct)}% del presupuesto usado`} />
              <span className="text-caption text-muted-foreground">{Math.round(budgetPct)}% usado</span>
            </div>
          ) : (
            <EmptyState
              title="Sin presupuestos"
              description="Definí cuánto querés gastar por categoría y seguí tu avance."
              action={<Button variant="outline" render={<Link href="/budgets/new">Nuevo presupuesto</Link>} />}
            />
          )}
        </SectionCard>

        <SectionCard icon={TargetIcon} title="Metas" action={topGoals.length > 0 ? { label: "Ver todas", href: "/goals" } : undefined}>
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
      </section>

      {/* spendable breakdown dialog trigger (kept from §17). */}
      {projection ? (
        <div className="flex justify-center">
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
        </div>
      ) : null}
    </div>
  );
}

function recentKind(type: string): TxnKind {
  if (type === "INCOME" || type === "REFUND") return "income";
  if (type === "EXPENSE" || type === "LIABILITY_PAYMENT") return "expense";
  if (type === "TRANSFER_IN" || type === "TRANSFER_OUT") return "transfer";
  return "adjustment";
}

function buildWeeks(txns: MonthTxn[], currency: string) {
  const weeks: { label: string; income: number; expense: number }[] = Array.from({ length: 5 }, (_, i) => ({
    label: `Sem ${i + 1}`,
    income: 0,
    expense: 0,
  }));
  for (const t of txns) {
    if (t.currencyCode !== currency) continue;
    const iso = t.occurredAt instanceof Date ? t.occurredAt.toISOString() : String(t.occurredAt);
    const day = Number(iso.slice(8, 10));
    const idx = Math.min(4, Math.max(0, Math.floor((day - 1) / 7)));
    const amount = Math.abs(Number(t.amount));
    if (t.type === "INCOME" || t.type === "REFUND") weeks[idx].income += amount;
    else if (t.type === "EXPENSE" || t.type === "LIABILITY_PAYMENT") weeks[idx].expense += amount;
  }
  return weeks;
}
