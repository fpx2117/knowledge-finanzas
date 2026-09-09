import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { DeltaBadge } from "@/components/shared/delta-badge";
import { DonutChart } from "@/components/charts/donut-chart";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { BreakdownTable, ConversionNote, ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { ReportCurrencyPicker } from "@/features/reports/components/report-currency-picker";
import { loadReport } from "@/features/reports/services/load-report";
import { compactTotal, periodLabel, toSegments } from "@/features/reports/components/report-format";

export default async function ExpensesReportPage({ searchParams }: { searchParams: Promise<{ period?: string; currency?: string; convert?: string }> }) {
  const user = await requireCurrentUser();
  const { currencies, report, canConvert, converting } = await loadReport(user, await searchParams);
  const { currencyCode, kpis, comparison, expenseByCategory, coverage } = report;
  const topCategory = expenseByCategory[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Gastos" description={`Distribución de gastos — ${periodLabel(report.period)}.`} actions={<HeaderActions />} />
      <ReportsNav />
      <ReportCurrencyPicker basePath="/reports/expenses" currencies={currencies} active={report.currencyCode} period={report.period} converting={converting} canConvert={canConvert} />
      <ConversionNote conversion={report.conversion} displayCurrency={currencyCode} />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      {/* §10.3 — total del período, variación, categoría principal. */}
      <section aria-label="Resumen de gastos" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Gastado en el período"
          tone="negative"
          value={kpis.expense}
          currency={currencyCode}
          hint={comparison ? <DeltaBadge delta={comparison.expense} comparedToLabel={comparison.label} /> : undefined}
        />
        <StatCard label="Categoría principal">
          <span className="flex flex-col gap-0.5">
            <span className="truncate text-metric font-medium text-foreground">{topCategory?.name ?? "—"}</span>
            <span className="text-small font-normal text-muted-foreground">
              {topCategory ? `${Math.round(topCategory.share * 100)}% del gasto` : "Sin gastos categorizados"}
            </span>
          </span>
        </StatCard>
        <StatCard label="Categorías con gasto">
          <span className="text-metric font-medium text-foreground">{expenseByCategory.length}</span>
        </StatCard>
      </section>

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
