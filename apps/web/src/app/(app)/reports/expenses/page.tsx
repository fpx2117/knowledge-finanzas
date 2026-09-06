import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { BreakdownTable, ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { compactTotal, periodLabel, toSegments } from "@/features/reports/components/report-format";

const service = createReportService();

export default async function ExpensesReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, expenseByCategory, coverage } = report;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Gastos" description={`Distribución de gastos — ${periodLabel(report.period)}.`} actions={<HeaderActions />} />
      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard title="Distribución de gastos" eyebrow={periodLabel(report.period)}>
          {expenseByCategory.length > 0 ? (
            <DonutChart segments={toSegments(expenseByCategory)} centerLabel="Gasto total" centerValue={compactTotal(expenseByCategory, currencyCode)} />
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">Sin gastos categorizados este mes.</p>
          )}
        </SectionCard>
        <SectionCard title="Gastos por categoría">
          <BreakdownTable slices={expenseByCategory} currency={currencyCode} emptyLabel="Sin gastos categorizados este mes." period={report.period} />
        </SectionCard>
      </div>
    </div>
  );
}
