import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { accountRepository, categoryRepository, transactionRepository } from "@know-finanzas/db";
import { monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { QuickAddButton } from "@/features/capture/components/quick-add-button";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";
import { TransactionsTable, type TransactionRow } from "@/features/transactions/components/transactions-table";
import { createReportService } from "@/features/reports/services/report-service";
import { BreakdownTable } from "@/features/reports/components/report-shared";

const reports = createReportService();
const PAGE_SIZE = 40;

function parsePeriod(period: string | undefined, timezone: string) {
  const match = period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? period : todayInTimezone(new Date(), timezone).slice(0, 7);
  const [year, month] = match.split("-").map(Number);
  return { period: match, range: monthRangeForTimezone(year, month, timezone) };
}

const CONFIG = {
  EXPENSE: {
    title: "Gastos",
    description: "Todo lo que salió, este período.",
    kpiTotal: "Gastado en el período",
    breakdownTitle: "Distribución por categoría",
    emptyBreakdown: "Sin gastos categorizados este período.",
    reportHref: "/reports/expenses",
    empty: "Todavía no registraste gastos en este período.",
  },
  INCOME: {
    title: "Ingresos",
    description: "De dónde vino el dinero, este período.",
    kpiTotal: "Ingresado en el período",
    breakdownTitle: "Origen por categoría",
    emptyBreakdown: "Sin ingresos categorizados este período.",
    reportHref: "/reports/income",
    empty: "Todavía no registraste ingresos en este período.",
  },
} as const;

// spec 03 §10 (Gastos) / §11 (Ingresos) — un filtro semántico sobre movimientos confirmados.
// No es un reporte completo (§10.4): resumen breve + distribución + lista, con CTA a Reportes.
export async function TypedTransactionsView({
  userId,
  timezone,
  baseCurrency,
  kind,
  searchParams,
}: {
  userId: string;
  timezone: string;
  baseCurrency: string;
  kind: "EXPENSE" | "INCOME";
  searchParams: { period?: string; page?: string };
}) {
  const config = CONFIG[kind];
  const { period, range } = parsePeriod(searchParams.period, timezone);
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [report, rows, accounts, categories] = await Promise.all([
    reports.getReport({ userId, timezone, baseCurrency, period }),
    transactionRepository.listForUser(userId, { type: kind, from: range.start, to: range.end, limit: 400 }),
    accountRepository.listForUser(userId, { includeArchived: true }),
    categoryRepository.listForUser(userId, { includeArchived: true }),
  ]);

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const currency = report.currencyCode;
  const inBase = rows.filter((row) => row.currencyCode === currency && row.status === "POSTED");
  const count = inBase.length;
  const total = kind === "EXPENSE" ? report.kpis.expense : report.kpis.income;
  const average = count > 0 ? String(Math.round(Number(total) / count)) : "0";
  const byCategory = kind === "EXPENSE" ? report.expenseByCategory : report.incomeByCategory;

  const pageRows: TransactionRow[] = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row) => ({
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
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (searchParams.period) params.set("period", searchParams.period);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/transactions/${kind === "EXPENSE" ? "expenses" : "income"}?${qs}` : `/transactions/${kind === "EXPENSE" ? "expenses" : "income"}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <HeaderActions />
            <QuickAddButton type={kind}>{kind === "EXPENSE" ? "Registrar gasto" : "Registrar ingreso"}</QuickAddButton>
          </>
        }
      />

      <TransactionsSubnav />

      {/* §10.3 — 3 métricas: total, cantidad, ticket promedio. */}
      <section aria-label="Resumen del período" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={config.kpiTotal} tone={kind === "EXPENSE" ? "negative" : "positive"} value={total} currency={currency} hint={report.coverage.excludedCurrencies.length > 0 ? `No incluye ${report.coverage.excludedCurrencies.join(", ")}` : undefined} />
        <StatCard label="Cantidad">
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{count}</span>
            <span className="text-small font-normal text-muted-foreground">{kind === "EXPENSE" ? "gastos" : "ingresos"} en el período</span>
          </span>
        </StatCard>
        <StatCard label="Ticket promedio" value={average} currency={currency} hint="Total ÷ cantidad" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <TransactionsTable
          rows={pageRows}
          page={page}
          prevHref={page > 1 ? pageHref(page - 1) : undefined}
          nextHref={page < totalPages ? pageHref(page + 1) : undefined}
        />

        <div className="flex flex-col gap-4">
          <SectionCard
            title={config.breakdownTitle}
            action={{ label: "Ver en Reportes", href: config.reportHref }}
          >
            <BreakdownTable slices={byCategory.slice(0, 8)} currency={currency} emptyLabel={config.emptyBreakdown} period={period} />
          </SectionCard>

          <p className="text-caption text-muted-foreground">
            <Link href={config.reportHref} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
              Análisis completo en Reportes <ArrowRightIcon className="size-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
