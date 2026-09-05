import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { BreakdownTable, ExcludedCurrenciesNote, ReportsNav, periodLabel } from "@/features/reports/components/report-shared";

const service = createReportService();

// spec 14 §8 "/reports/categories" — both directions side by side, for the question
// "what does each category account for," as distinct from Gastos/Ingresos (which lead with the
// donut and the money moved in one direction).
export default async function CategoriesReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, expenseByCategory, incomeByCategory, coverage } = report;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Categorías" description={`Todas tus categorías — ${periodLabel(report.period)}.`} actions={<HeaderActions />} />
      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Gastos" eyebrow={`${expenseByCategory.length}`}>
          <BreakdownTable slices={expenseByCategory} currency={currencyCode} emptyLabel="Sin gastos categorizados este mes." period={report.period} />
        </SectionCard>
        <SectionCard title="Ingresos" eyebrow={`${incomeByCategory.length}`}>
          <BreakdownTable slices={incomeByCategory} currency={currencyCode} emptyLabel="Sin ingresos categorizados este mes." period={report.period} />
        </SectionCard>
      </div>
    </div>
  );
}
