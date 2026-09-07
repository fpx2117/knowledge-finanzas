import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ScaleIcon, LayersIcon } from "lucide-react";

import {
  accountRepository,
  categoryRepository,
  createBudgetQueries,
  createMonthlySummaryQueries,
  db,
  transactionRepository,
} from "@know-finanzas/db";
import { monthRangeForTimezone, Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { InsightCard } from "@/components/shared/insight-card";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";
import { TransactionsFilters } from "@/features/transactions/components/transactions-filters";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";
import { TransactionsTable, type TransactionRow } from "@/features/transactions/components/transactions-table";

const monthlyQueries = createMonthlySummaryQueries(db);
const budgetQueries = createBudgetQueries(db);

const PAGE_SIZE = 15;
const DONUT_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function resolvePeriod(period: string | undefined, timezone: string) {
  const today = todayInTimezone(new Date(), timezone);
  const [y, m] = (period && /^\d{4}-\d{2}$/.test(period) ? period : today.slice(0, 7)).split("-").map(Number);
  return { range: monthRangeForTimezone(y, m, timezone), key: `${y}-${String(m).padStart(2, "0")}` };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; account?: string; page?: string; period?: string; category?: string }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser();

  const page = Math.max(1, Number(params.page) || 1);
  const type = params.type === "INCOME" || params.type === "EXPENSE" ? params.type : undefined;
  const accountId = params.account && params.account !== "ALL" ? params.account : undefined;
  const categoryId = params.category || undefined;
  const { range } = resolvePeriod(params.period, user.timezone);

  const [accounts, categories, rows, monthly, categorySpend] = await Promise.all([
    accountRepository.listForUser(user.id, { includeArchived: true }),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
    transactionRepository.listForUser(user.id, {
      type,
      accountId,
      categoryId,
      from: range.start,
      to: range.end,
      limit: PAGE_SIZE + 1,
      offset: (page - 1) * PAGE_SIZE,
    }),
    monthlyQueries.getMonthlyIncomeExpense(user.id, { from: range.start, to: range.end }),
    budgetQueries.getCategorySpendingForUser(user.id, { from: range.start, to: range.end }),
  ]);

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const hasNext = rows.length > PAGE_SIZE;
  const pageRows: TransactionRow[] = rows.slice(0, PAGE_SIZE).map((row) => ({
    id: row.id,
    occurredAt: row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
    description: row.description,
    merchant: row.merchant ?? null,
    categoryName: row.categoryId ? categoryName.get(row.categoryId) ?? null : null,
    accountName: accountName.get(row.accountId) ?? "Cuenta",
    type: row.type,
    amount: String(row.amount),
    currencyCode: row.currencyCode,
    status: row.status,
  }));

  // spec 03 §9.3 — resumen del período: ingresos / gastos / resultado, monedas separadas, nunca
  // un total fusionado si hay monedas incomparables (§10.3 / RF-03). Transferencias internas ya
  // están excluidas por la query (sólo INCOME/EXPENSE/REFUND).
  const periodByCurrency = monthly
    .map((m) => {
      const income = m.incomeTotal ?? "0";
      const expense = m.netExpense ?? m.expenseTotal ?? "0";
      return {
        currencyCode: m.currencyCode,
        income,
        expense,
        result: Money.fromString(income, m.currencyCode).subtract(Money.fromString(expense, m.currencyCode)).toString(),
      };
    })
    .filter((m) => Number(m.income) !== 0 || Number(m.expense) !== 0)
    .sort((a, b) => Number(b.income) + Number(b.expense) - (Number(a.income) + Number(a.expense)));
  const primary = periodByCurrency.find((m) => m.currencyCode === user.baseCurrency) ?? periodByCurrency[0];
  const currency = primary?.currencyCode ?? user.baseCurrency;
  const multiCurrency = periodByCurrency.length > 1;

  // Category donut (expenses this period).
  const spendRows = categorySpend
    .filter((r) => r.currencyCode === currency && Number(r.netExpense) > 0)
    .map((r) => ({ name: (r.categoryId && categoryName.get(r.categoryId)) || "Sin categoría", value: Number(r.netExpense) }))
    .sort((a, b) => b.value - a.value);
  const totalSpend = spendRows.reduce((s, r) => s + r.value, 0);
  const other = spendRows.slice(5).reduce((s, r) => s + r.value, 0);
  const donutSegments: DonutSegment[] = [
    ...spendRows.slice(0, 5).map((r, i) => ({ label: r.name, value: r.value, color: DONUT_COLORS[i] })),
    ...(other > 0 ? [{ label: "Otros", value: other, color: "var(--muted-foreground)" }] : []),
  ];

  const buildHref = (targetPage: number) => {
    const next = new URLSearchParams();
    if (params.type) next.set("type", params.type);
    if (params.account) next.set("account", params.account);
    if (params.period) next.set("period", params.period);
    if (params.category) next.set("category", params.category);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };

  const categoryFilterName = categoryId ? categoryName.get(categoryId) ?? "categoría" : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Transacciones"
        description="Todos los movimientos"
        actions={
          <>
            <HeaderActions />
            <Button variant="ghost" render={<Link href="/settings/imports">Importar</Link>} />
            <QuickAddButton>Registrar</QuickAddButton>
          </>
        }
      />

      <TransactionsSubnav />

      {categoryFilterName ? (
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          Filtrado por categoría: <span className="font-medium text-foreground">{categoryFilterName}</span>
          <Link href={buildHref(1).replace(/[?&]category=[^&]*/, "")} className="text-brand hover:underline">
            Quitar filtro
          </Link>
        </p>
      ) : null}

      <TransactionsFilters accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />

      {/* §9.3 — exactamente 3 KPIs (ingresos / gastos / resultado), transferencias internas
          excluidas, monedas separadas. */}
      {multiCurrency ? (
        <section aria-label="Resumen del período" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {periodByCurrency.map((m) => (
            <div key={m.currencyCode} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                <LayersIcon className="size-3.5" /> {m.currencyCode} · este período
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-small">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">Ingresos</dt>
                  <dd><MoneyAmount amount={m.income} currency={m.currencyCode} tone="positive" className="font-medium" /></dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">Gastos</dt>
                  <dd><MoneyAmount amount={m.expense} currency={m.currencyCode} tone="negative" className="font-medium" /></dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-muted-foreground">Resultado</dt>
                  <dd><MoneyAmount amount={m.result} currency={m.currencyCode} tone={Number(m.result) >= 0 ? "positive" : "negative"} className="font-medium" /></dd>
                </div>
              </dl>
            </div>
          ))}
        </section>
      ) : (
        <section aria-label="Resumen del período" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Ingresos del período" icon={ArrowUpIcon} tone="positive" value={primary?.income ?? "0"} currency={currency} hint="Sin transferencias internas" />
          <StatCard label="Gastos del período" icon={ArrowDownIcon} tone="negative" value={primary?.expense ?? "0"} currency={currency} hint="Neto de reembolsos" />
          <StatCard
            label="Resultado del período"
            icon={ScaleIcon}
            tone={Number(primary?.result ?? 0) >= 0 ? "positive" : "negative"}
            value={primary?.result ?? "0"}
            currency={currency}
            hint="Ingresos menos gastos"
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <TransactionsTable
          rows={pageRows}
          page={page}
          prevHref={page > 1 ? buildHref(page - 1) : undefined}
          nextHref={hasNext ? buildHref(page + 1) : undefined}
        />

        <div className="flex flex-col gap-4">
          <SectionCard title="Distribución por categoría" eyebrow="Gastos del período">
            {donutSegments.length > 0 ? (
              <DonutChart
                segments={donutSegments}
                centerLabel="Total gastado"
                centerValue={new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(totalSpend)}
              />
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">Sin gastos categorizados en este período.</p>
            )}
          </SectionCard>

          <InsightCard title="Tu actividad">
            <p>
              {spendRows.length > 0
                ? `${spendRows[0].name} es tu mayor gasto del período.`
                : "Registrá algunos movimientos y vas a ver acá patrones y sugerencias."}
            </p>
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
