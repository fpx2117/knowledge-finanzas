import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { DeltaBadge } from "@/components/shared/delta-badge";
import { DonutChart } from "@/components/charts/donut-chart";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { BreakdownTable, ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { compactTotal, periodLabel, toSegments } from "@/features/reports/components/report-format";

const service = createReportService();

export default async function IncomeReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, kpis, comparison, incomeByCategory, coverage } = report;
  const topCategory = incomeByCategory[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Ingresos" description={`Origen de tus ingresos — ${periodLabel(report.period)}.`} actions={<HeaderActions />} />
      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      <section aria-label="Resumen de ingresos" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Ingresado en el período"
          tone="positive"
          value={kpis.income}
          currency={currencyCode}
          hint={comparison ? <DeltaBadge delta={comparison.income} comparedToLabel={comparison.label} /> : undefined}
        />
        <StatCard label="Fuente principal">
          <span className="flex flex-col gap-0.5">
            <span className="truncate text-metric font-medium text-foreground">{topCategory?.name ?? "—"}</span>
            <span className="text-small font-normal text-muted-foreground">
              {topCategory ? `${Math.round(topCategory.share * 100)}% del ingreso` : "Sin ingresos categorizados"}
            </span>
          </span>
        </StatCard>
        <StatCard label="Fuentes de ingreso">
          <span className="text-metric font-medium text-foreground">{incomeByCategory.length}</span>
        </StatCard>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SectionCard title="Origen de los ingresos" eyebrow={periodLabel(report.period)}>
          {incomeByCategory.length > 0 ? (
            <DonutChart segments={toSegments(incomeByCategory)} centerLabel="Ingreso total" centerValue={compactTotal(incomeByCategory, currencyCode)} />
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">Sin ingresos categorizados este mes.</p>
          )}
        </SectionCard>
        <SectionCard title="Ingresos por categoría">
          <BreakdownTable slices={incomeByCategory} currency={currencyCode} emptyLabel="Sin ingresos categorizados este mes." period={report.period} />
        </SectionCard>
      </div>
    </div>
  );
}
