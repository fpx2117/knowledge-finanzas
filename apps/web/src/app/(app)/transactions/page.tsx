import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ScaleIcon, ListIcon } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { TransactionsFilters } from "@/features/transactions/components/transactions-filters";
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
  searchParams: Promise<{ type?: string; account?: string; page?: string; period?: string }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser();

  const page = Math.max(1, Number(params.page) || 1);
  const type = params.type === "INCOME" || params.type === "EXPENSE" ? params.type : undefined;
  const accountId = params.account && params.account !== "ALL" ? params.account : undefined;
  const { range } = resolvePeriod(params.period, user.timezone);

  const [accounts, categories, rows, monthly, categorySpend] = await Promise.all([
    accountRepository.listForUser(user.id, { includeArchived: true }),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
    transactionRepository.listForUser(user.id, {
      type,
      accountId,
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

  const currency = monthly[0]?.currencyCode ?? user.baseCurrency;
  const primaryMonthly = monthly.find((m) => m.currencyCode === currency);
  const income = primaryMonthly?.incomeTotal ?? "0";
  const expense = primaryMonthly?.netExpense ?? primaryMonthly?.expenseTotal ?? "0";
  const result = Money.fromString(income, currency).subtract(Money.fromString(expense, currency)).toString();

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
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Transacciones"
        description="Registrá, buscá y entendé tus movimientos financieros."
        actions={
          <>
            <HeaderActions />
            <Button variant="ghost" render={<Link href="/importar">Importar</Link>} />
            <Button variant="outline" render={<Link href="/transfers/new">Transferencia</Link>} />
            <Button render={<Link href="/transactions/new?type=EXPENSE">Nueva transacción</Link>} />
          </>
        }
      />

      <TransactionsFilters accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />

      <section aria-label="Resumen del período" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos del período" icon={ArrowUpIcon} tone="positive" value={income} currency={currency} hint="Movimientos de entrada" />
        <StatCard label="Gastos del período" icon={ArrowDownIcon} tone="negative" value={expense} currency={currency} hint="Neto de reembolsos" />
        <StatCard
          label="Resultado del período"
          icon={ScaleIcon}
          tone={Number(result) >= 0 ? "positive" : "negative"}
          value={result}
          currency={currency}
          hint="Ingresos menos gastos"
        />
        <StatCard label="Movimientos" icon={ListIcon}>
          <span className="text-metric font-medium text-foreground">{pageRows.length + (hasNext ? "+" : "")}</span>
        </StatCard>
      </section>

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
