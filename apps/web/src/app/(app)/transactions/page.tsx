import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  LayersIcon,
  RepeatIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";

import {
  accountRepository,
  categoryRepository,
  createBudgetQueries,
  createMonthlySummaryQueries,
  createTransferRepository,
  db,
  merchantRepository,
  transactionRepository,
} from "@know-finanzas/db";
import { monthRangeForTimezone, Money, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { MoneyAmount } from "@/components/financial/money-amount";
import { MerchantLogo } from "@/components/financial/merchant-logo";
import { KpiCard, type KpiDelta } from "@/features/dashboard/components/kpi-card";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";
import { formatShortDate } from "@/lib/format";
import { TransactionsFilters } from "@/features/transactions/components/transactions-filters";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";
import { TransactionsTable, type TransactionRow } from "@/features/transactions/components/transactions-table";
import { TransferDialog } from "@/features/transfers/components/transfer-dialog";
import { subscriptionDetectionService } from "@/features/transactions/services/subscription-detection-service.instance";

const monthlyQueries = createMonthlySummaryQueries(db);
const budgetQueries = createBudgetQueries(db);
const transferRepo = createTransferRepository(db);

const ROW_LIMIT = 300;
const BAR_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const FREQ_LABEL: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  YEARLY: "Anual",
};

const MONTH_LABEL = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

function resolvePeriod(period: string | undefined, timezone: string) {
  const today = todayInTimezone(new Date(), timezone);
  const [y, m] = (period && /^\d{4}-\d{2}$/.test(period) ? period : today.slice(0, 7)).split("-").map(Number);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return {
    range: monthRangeForTimezone(y, m, timezone),
    prevRange: monthRangeForTimezone(prevY, prevM, timezone),
    label: MONTH_LABEL.format(new Date(Date.UTC(y, m - 1, 1))).replace(/^\w/, (c) => c.toUpperCase()),
  };
}

function deltaPct(current: number, previous: number): KpiDelta {
  if (!previous) return null;
  return { pct: ((current - previous) / Math.abs(previous)) * 100, comparedTo: "mes anterior" };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; account?: string; period?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const user = await requireCurrentUser();

  // Tipo (ingreso/gasto) lo maneja el chip client-side de la lista, no un filtro de servidor —
  // así "Todos ⇄ Ingresos ⇄ Gastos" no recarga la página. `?type=` sólo fija el chip inicial
  // (lo usan los redirects de las rutas viejas /transactions/expenses e /income).
  const defaultChip =
    params.type === "INCOME" ? "income" : params.type === "EXPENSE" ? "expense" : params.type === "TRANSFER" ? "transfer" : "ALL";
  const accountId = params.account && params.account !== "ALL" ? params.account : undefined;
  const categoryId = params.category || undefined;
  const SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"] as const;
  const sort = (SORTS as readonly string[]).includes(params.sort ?? "") ? (params.sort as (typeof SORTS)[number]) : undefined;
  const { range, prevRange, label: periodLabel } = resolvePeriod(params.period, user.timezone);

  const [accounts, categories, rows, allTransfers, monthly, prevMonthly, categorySpend, subscriptions] = await Promise.all([
    accountRepository.listForUser(user.id, { includeArchived: true }),
    categoryRepository.listForUser(user.id, { includeArchived: true }),
    transactionRepository.listForUser(user.id, {
      accountId,
      categoryId,
      from: range.start,
      to: range.end,
      sort,
      limit: ROW_LIMIT,
    }),
    transferRepo.listForUserWithStatus(user.id).catch(() => []),
    monthlyQueries.getMonthlyIncomeExpense(user.id, { from: range.start, to: range.end }),
    monthlyQueries.getMonthlyIncomeExpense(user.id, { from: prevRange.start, to: prevRange.end }).catch(() => []),
    budgetQueries.getCategorySpendingForUser(user.id, { from: range.start, to: range.end }),
    subscriptionDetectionService.listSubscriptions(user.id).catch(() => []),
  ]);

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const merchantIdentities = await merchantRepository.identitiesByIds([
    ...rows.map((row) => row.merchantId).filter((id): id is string => Boolean(id)),
    ...subscriptions.map((s) => s.merchantId),
  ]);

  const iso = (value: Date | string) => (value instanceof Date ? value.toISOString() : String(value));

  // Movimientos confirmados (ingreso / gasto / reembolso).
  const txnRows: TransactionRow[] = rows.map((row) => ({
    id: row.id,
    occurredAt: iso(row.occurredAt),
    description: row.description,
    merchant: row.merchantId ? merchantIdentities.get(row.merchantId)?.canonicalName ?? row.merchant ?? null : row.merchant ?? null,
    merchantDomain: row.merchantId ? merchantIdentities.get(row.merchantId)?.domain ?? null : null,
    categoryName: row.categoryId ? categoryName.get(row.categoryId) ?? null : null,
    accountName: accountName.get(row.accountId) ?? "Cuenta",
    type: row.type,
    amount: String(row.amount),
    currencyCode: row.currencyCode,
    status: row.status,
  }));

  // Transferencias internas del período — una fila por operación (no dos legs), plegadas en la
  // misma lista bajo el chip "Transferencias".
  const transferRows: TransactionRow[] = allTransfers
    .filter((t) => {
      const at = new Date(iso(t.occurredAt)).getTime();
      return at >= range.start.getTime() && at < range.end.getTime();
    })
    .map((t) => ({
      id: `transfer-${t.id}`,
      occurredAt: iso(t.occurredAt),
      description: `${accountName.get(t.fromAccountId) ?? "Cuenta"} → ${accountName.get(t.toAccountId) ?? "Cuenta"}`,
      merchant: null,
      merchantDomain: null,
      categoryName: null,
      accountName: t.notes || "Transferencia interna",
      type: "TRANSFER",
      amount: String(t.amount),
      currencyCode: t.currencyCode,
      status: t.voided ? "VOIDED" : "POSTED",
    }));

  const pageRows: TransactionRow[] = [...txnRows, ...transferRows].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  // spec 03 §9.3 — resumen del período: ingresos / gastos / resultado, monedas separadas, nunca
  // un total fusionado si hay monedas incomparables (§10.3 / RF-03).
  const periodByCurrency = monthly
    .map((m) => {
      const income = m.incomeTotal ?? "0";
      const expense = m.netExpense ?? m.expenseTotal ?? "0";
      return {
        currencyCode: m.currencyCode,
        income,
        expense,
        count: m.movementCount ?? 0,
        result: Money.fromString(income, m.currencyCode).subtract(Money.fromString(expense, m.currencyCode)).toString(),
      };
    })
    .filter((m) => Number(m.income) !== 0 || Number(m.expense) !== 0 || m.count > 0)
    .sort((a, b) => Number(b.income) + Number(b.expense) - (Number(a.income) + Number(a.expense)));
  const primary = periodByCurrency.find((m) => m.currencyCode === user.baseCurrency) ?? periodByCurrency[0];
  const currency = primary?.currencyCode ?? user.baseCurrency;
  const multiCurrency = periodByCurrency.length > 1;

  const prevPrimary = prevMonthly.find((m) => m.currencyCode === currency);
  const movementCount = periodByCurrency.reduce((sum, m) => sum + m.count, 0);
  const prevMovementCount = prevMonthly.reduce((sum, m) => sum + (m.movementCount ?? 0), 0);
  const prevIncome = Number(prevPrimary?.incomeTotal ?? 0);
  const prevExpense = Number(prevPrimary?.netExpense ?? prevPrimary?.expenseTotal ?? 0);
  const prevResult = prevIncome - prevExpense;

  // Categorías con más gasto (período, moneda principal).
  const spendRows = categorySpend
    .filter((r) => r.currencyCode === currency && Number(r.netExpense) > 0)
    .map((r) => ({ name: (r.categoryId && categoryName.get(r.categoryId)) || "Sin categoría", value: Number(r.netExpense) }))
    .sort((a, b) => b.value - a.value);
  const totalSpend = spendRows.reduce((s, r) => s + r.value, 0);
  const topSpend = spendRows.slice(0, 5);

  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").slice(0, 4);

  const categoryFilterName = categoryId ? categoryName.get(categoryId) ?? "categoría" : null;
  const money0 = new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimientos"
        description="Todos los movimientos"
        actions={
          <>
            <HeaderActions />
            <TransferDialog
              accounts={accounts
                .filter((a) => a.status === "ACTIVE")
                .map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode }))}
              timezone={user.timezone}
            />
            <Button variant="outline" render={<Link href="/settings/imports">Importar</Link>} />
            <QuickAddButton>Registrar</QuickAddButton>
          </>
        }
      />

      <section aria-label="Indicadores del mes" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Movimientos del mes"
          icon={WalletIcon}
          tone="brand"
          display={String(movementCount)}
          delta={deltaPct(movementCount, prevMovementCount)}
          hint={prevMovementCount ? undefined : "Sin datos del mes anterior"}
        />
        <KpiCard
          label="Gastos"
          icon={ArrowDownIcon}
          tone="negative"
          value={primary?.expense ?? "0"}
          currency={currency}
          delta={deltaPct(Number(primary?.expense ?? 0), prevExpense)}
          hint={prevExpense ? undefined : "Neto de reembolsos"}
        />
        <KpiCard
          label="Ingresos"
          icon={ArrowUpIcon}
          tone="positive"
          value={primary?.income ?? "0"}
          currency={currency}
          delta={deltaPct(Number(primary?.income ?? 0), prevIncome)}
          hint={prevIncome ? undefined : "Sin transferencias internas"}
        />
        <KpiCard
          label="Balance"
          icon={ScaleIcon}
          tone={Number(primary?.result ?? 0) >= 0 ? "positive" : "negative"}
          value={primary?.result ?? "0"}
          currency={currency}
          delta={deltaPct(Number(primary?.result ?? 0), prevResult)}
          hint={prevResult ? undefined : "Ingresos menos gastos"}
        />
      </section>

      <TransactionsSubnav />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {categoryFilterName ? (
            <p className="flex items-center gap-2 text-small text-muted-foreground">
              Filtrado por categoría: <span className="font-medium text-foreground">{categoryFilterName}</span>
              <Link href="/transactions" className="text-brand hover:underline">
                Quitar filtro
              </Link>
            </p>
          ) : null}

          <TransactionsFilters accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />

          <TransactionsTable rows={pageRows} timezone={user.timezone} defaultChip={defaultChip} />
        </div>

        <aside className="flex flex-col gap-4">
          {/* §9.3 — ingresos / gastos / resultado, monedas separadas, sin total fusionado. */}
          <section aria-label="Resumen del período">
            <SectionCard title="Resumen del período" subtitle={periodLabel} icon={CalendarIcon}>
              {multiCurrency ? (
                <div className="flex flex-col gap-4">
                  {periodByCurrency.map((m) => (
                    <div key={m.currencyCode} className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                        <LayersIcon className="size-3.5" /> {m.currencyCode} · este período
                      </span>
                      <SummaryRow label="Total de gastos" amount={m.expense} currency={m.currencyCode} tone="negative" />
                      <SummaryRow label="Total de ingresos" amount={m.income} currency={m.currencyCode} tone="positive" />
                      <SummaryRow label="Balance" amount={m.result} currency={m.currencyCode} tone={Number(m.result) >= 0 ? "positive" : "negative"} strong />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <SummaryRow label="Total de gastos" amount={primary?.expense ?? "0"} currency={currency} tone="negative" />
                  <SummaryRow label="Total de ingresos" amount={primary?.income ?? "0"} currency={currency} tone="positive" />
                  <div className="mt-1 border-t border-border-subtle pt-2">
                    <SummaryRow
                      label="Balance"
                      amount={primary?.result ?? "0"}
                      currency={currency}
                      tone={Number(primary?.result ?? 0) >= 0 ? "positive" : "negative"}
                      strong
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </section>

          <SectionCard
            title="Categorías con más gasto"
            action={{ label: "Ver todas", href: "/reports/expenses" }}
          >
            {topSpend.length > 0 ? (
              <ul className="flex flex-col gap-3.5">
                {topSpend.map((row, i) => {
                  const pct = totalSpend > 0 ? Math.round((row.value / totalSpend) * 100) : 0;
                  return (
                    <li key={row.name} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-caption">
                        <span className="flex min-w-0 items-center gap-2">
                          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: BAR_COLORS[i] }} />
                          <span className="truncate font-medium text-foreground">{row.name}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {pct}% · {money0.format(row.value)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: BAR_COLORS[i] }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-center text-small text-muted-foreground">Sin gastos categorizados en este período.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Actividad recurrente detectada"
            icon={RepeatIcon}
            action={{ label: "Ver todos", href: "/obligations/subscriptions" }}
          >
            {activeSubs.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border-subtle">
                {activeSubs.map((sub) => {
                  const identity = merchantIdentities.get(sub.merchantId);
                  const name = identity?.canonicalName ?? sub.label;
                  return (
                    <li key={sub.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <MerchantLogo name={name} domain={identity?.domain} className="size-8" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-small font-bold text-foreground">{name}</span>
                        <span className="truncate text-caption text-muted-foreground">
                          {sub.categoryName ? `${sub.categoryName} · ` : ""}
                          {FREQ_LABEL[sub.frequency] ?? sub.frequency}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <MoneyAmount amount={sub.currentAmount} currency={sub.currencyCode} variant="compact" className="text-small font-bold text-foreground" />
                        <span className="text-[10px] text-muted-foreground">Próximo: {formatShortDate(sub.nextExpectedOn)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-center text-small text-muted-foreground">
                Todavía no detectamos cargos que se repitan.
              </p>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  currency,
  tone,
  strong = false,
}: {
  label: string;
  amount: string;
  currency: string;
  tone: "positive" | "negative";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={strong ? "text-small font-semibold text-foreground" : "text-small text-muted-foreground"}>{label}</span>
      <MoneyAmount amount={amount} currency={currency} tone={tone} className={strong ? "text-body-lg font-bold" : "text-small font-semibold"} />
    </div>
  );
}
