import { ArrowDownRightIcon, ArrowUpRightIcon, PiggyBankIcon, WalletIcon, LineChartIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { InsightCard } from "@/components/shared/insight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarComparisonChart } from "@/components/charts/bar-comparison-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { BreakdownTable, ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { compactTotal, periodLabel, toSegments } from "@/features/reports/components/report-format";

const service = createReportService();

export default async function ReportsOverviewPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, kpis, months, expenseByCategory, coverage } = report;
  const periodQuery = `?period=${report.period}`;

  const hasData = Number(kpis.income) > 0 || Number(kpis.expense) > 0 || months.some((m) => Number(m.income) > 0 || Number(m.expense) > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes"
        description={`Análisis de tus finanzas — ${periodLabel(report.period)}.`}
        actions={<HeaderActions />}
      />

      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      {!hasData ? (
        <EmptyState
          icon={<LineChartIcon />}
          title="Todavía no hay datos para reportar"
          description="Cargá transacciones durante el mes y acá vas a ver la evolución, la distribución de gastos y tu ahorro."
        />
      ) : (
        <>
          <section aria-label="Indicadores del mes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ingresos del mes" icon={ArrowDownRightIcon} tone="positive" value={kpis.income} currency={currencyCode} hint="Total recibido en el período" />
            <StatCard label="Gastos del mes" icon={ArrowUpRightIcon} tone="negative" value={kpis.expense} currency={currencyCode} hint="Total gastado en el período" />
            <StatCard label="Ahorro del mes" icon={PiggyBankIcon} tone={Number(kpis.savings) >= 0 ? "positive" : "negative"}>
              <span className="flex flex-col gap-0.5">
                <MoneyAmount amount={kpis.savings} currency={currencyCode} variant="compact" sign="always" tone="auto" className="text-metric" />
                <span className="text-small font-normal text-muted-foreground">{kpis.savingsRate}% de tus ingresos</span>
              </span>
            </StatCard>
            <StatCard label="Patrimonio neto" icon={WalletIcon} value={kpis.netWorth} currency={currencyCode} hint="Activos líquidos menos deudas" />
          </section>

          <SectionCard title="Evolución mensual" eyebrow="Últimos 6 meses" info="Ingresos y gastos registrados cada mes, en tu moneda base.">
            <BarComparisonChart
              rows={months.map((month) => ({ label: month.label, income: Number(month.income), expense: Number(month.expense) }))}
              currency={currencyCode}
            />
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <SectionCard title="Distribución de gastos" action={{ label: "Ver detalle", href: `/reports/expenses${periodQuery}` }}>
              {expenseByCategory.length > 0 ? (
                <DonutChart segments={toSegments(expenseByCategory)} centerLabel="Gasto total" centerValue={compactTotal(expenseByCategory, currencyCode)} />
              ) : (
                <p className="py-6 text-center text-small text-muted-foreground">Sin gastos categorizados este mes.</p>
              )}
            </SectionCard>
            <SectionCard title="Top categorías de gasto">
              <BreakdownTable slices={expenseByCategory.slice(0, 6)} currency={currencyCode} emptyLabel="Sin gastos categorizados este mes." period={report.period} />
            </SectionCard>
          </div>

          <InsightCard title="Lectura del mes">
            {Number(kpis.savings) >= 0 ? (
              <p>
                Ahorraste{" "}
                <strong className="text-foreground">
                  <MoneyAmount amount={kpis.savings} currency={currencyCode} variant="compact" />
                </strong>{" "}
                este mes — el {kpis.savingsRate}% de lo que ingresó.{" "}
                {expenseByCategory[0] ? `Tu mayor gasto fue ${expenseByCategory[0].name} (${Math.round(expenseByCategory[0].share * 100)}%).` : ""}
              </p>
            ) : (
              <p>
                Gastaste{" "}
                <strong className="text-foreground">
                  <MoneyAmount amount={String(Math.abs(Number(kpis.savings)))} currency={currencyCode} variant="compact" />
                </strong>{" "}
                más de lo que ingresó este mes.{" "}
                {expenseByCategory[0] ? `El mayor gasto fue ${expenseByCategory[0].name}.` : ""}
              </p>
            )}
          </InsightCard>
        </>
      )}
    </div>
  );
}
