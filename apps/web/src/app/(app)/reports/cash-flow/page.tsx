import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { MoneyAmount } from "@/components/financial/money-amount";
import { BarComparisonChart } from "@/components/charts/bar-comparison-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { periodLabel } from "@/features/reports/components/report-format";

const service = createReportService();
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// spec 14 §8 "/reports/cash-flow" describes what already happened (§16 "Reportes describe";
// contrast with Dashboard's forward-looking projected cashflow, which is an estimate, not a
// report) — the trailing 6 months of confirmed income/expense/net, month by month.
export default async function CashFlowReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, months, coverage } = report;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Flujo de caja" description="Ingresos, gastos y resultado neto confirmados, mes a mes." actions={<HeaderActions />} />
      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      <SectionCard title="Últimos 6 meses" eyebrow={currencyCode}>
        <BarComparisonChart rows={months.map((month) => ({ label: month.label, income: Number(month.income), expense: Number(month.expense) }))} currency={currencyCode} />
      </SectionCard>

      <SectionCard title="Detalle mensual" contentClassName="gap-0">
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Mes</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Ingresos</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Gastos</TableHead>
                <TableHead className={`pr-5 text-right sm:pr-6 ${HEAD}`}>Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month) => (
                <TableRow key={month.period} className="h-[52px]">
                  <TableCell className="pl-5 text-small font-medium capitalize text-foreground sm:pl-6">{periodLabel(month.period)}</TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount amount={month.income} currency={currencyCode} variant="compact" className="text-small text-[var(--positive)]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount amount={month.expense} currency={currencyCode} variant="compact" className="text-small text-[var(--negative)]" />
                  </TableCell>
                  <TableCell className="pr-5 text-right sm:pr-6">
                    <MoneyAmount amount={month.net} currency={currencyCode} variant="compact" sign="always" tone="auto" className="text-small font-medium" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
