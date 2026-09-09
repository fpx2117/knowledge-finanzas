import { ArrowDownRightIcon, ArrowUpRightIcon, PiggyBankIcon, PercentIcon, LineChartIcon } from "lucide-react";

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
import { ReportCurrencyPicker } from "@/features/reports/components/report-currency-picker";
import { compactTotal, periodLabel, toSegments } from "@/features/reports/components/report-format";
import { DeltaBadge } from "@/components/shared/delta-badge";

const service = createReportService();

export default async function ReportsOverviewPage({ searchParams }: { searchParams: Promise<{ period?: string; currency?: string }> }) {
  const { period: periodParam, currency: currencyParam } = await searchParams;
  const user = await requireCurrentUser();
  const currencies = await service.listReportCurrencies(user.id, user.baseCurrency);
  const currency = currencyParam && currencies.includes(currencyParam) ? currencyParam : user.baseCurrency;
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, currency, period: periodParam });
  const { currencyCode, kpis, months, comparison, expenseByCategory, incomeByCategory, coverage } = report;
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
      <ReportCurrencyPicker basePath="/reports" currencies={currencies} active={currencyCode} period={report.period} />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      {!hasData ? (
        <EmptyState
          icon={<LineChartIcon />}
          title="Todavía no hay datos para reportar"
          description="Cargá transacciones durante el mes y acá vas a ver la evolución, la distribución de gastos y tu ahorro."
        />
      ) : (
        <>
          {/* §9.2 KPIs P0: ingresos, gastos, resultado neto, tasa de ahorro simple cuando aplique.
              Patrimonio vive en su propia subvista (§13) — no se adelanta como KPI acá. */}
          <section aria-label="Indicadores del período" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Ingresos"
              icon={ArrowDownRightIcon}
              tone="positive"
              value={kpis.income}
              currency={currencyCode}
              hint={comparison ? <DeltaBadge delta={comparison.income} comparedToLabel={comparison.label} /> : "Ingresos confirmados del período"}
            />
            <StatCard
              label="Gastos"
              icon={ArrowUpRightIcon}
              tone="negative"
              value={kpis.expense}
              currency={currencyCode}
              hint={comparison ? <DeltaBadge delta={comparison.expense} comparedToLabel={comparison.label} /> : "Gastos confirmados del período"}
            />
            <StatCard
              label="Resultado neto"
              icon={PiggyBankIcon}
              tone={Number(kpis.savings) >= 0 ? "positive" : "negative"}
              hint={comparison ? <DeltaBadge delta={comparison.savings} comparedToLabel={comparison.label} /> : "Ingresos menos gastos confirmados"}
            >
              <MoneyAmount amount={kpis.savings} currency={currencyCode} variant="compact" sign="always" tone="auto" className="text-metric" />
            </StatCard>
            <StatCard
              label="Tasa de ahorro simple"
              icon={PercentIcon}
              info="Resultado neto ÷ ingresos confirmados del período. Es una tasa simple del período, no una métrica de patrimonio."
              hint={kpis.savingsRate === null ? "Sin ingresos confirmados en el período" : "Del ingreso confirmado del período"}
            >
              {kpis.savingsRate === null ? <span className="text-muted-foreground">—</span> : `${kpis.savingsRate}%`}
            </StatCard>
          </section>

          <SectionCard title="Evolución mensual" eyebrow="Últimos 6 meses" info="Ingresos y gastos registrados cada mes, en tu moneda base.">
            <BarComparisonChart
              rows={months.map((month) => ({ label: month.label, income: Number(month.income), expense: Number(month.expense) }))}
              currency={currencyCode}
            />
          </SectionCard>

          {/* §9.5 "Qué explicó tus gastos" */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <SectionCard title="Qué explicó tus gastos" action={{ label: "Ver detalle", href: `/reports/expenses${periodQuery}` }}>
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

          {/* §9.6 "Principales ingresos" + §9.7 "Resultado por período" (también es el fallback
              tabular accesible del gráfico, §9.4). */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <SectionCard title="Principales ingresos" action={{ label: "Ver detalle", href: `/reports/income${periodQuery}` }}>
              <BreakdownTable slices={incomeByCategory.slice(0, 6)} currency={currencyCode} emptyLabel="Sin ingresos categorizados este mes." period={report.period} />
            </SectionCard>
            <SectionCard title="Resultado por período" eyebrow="Últimos 6 meses">
              <div className="overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-border text-caption uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="py-2 text-left font-semibold">Mes</th>
                      <th scope="col" className="py-2 text-right font-semibold">Ingresos</th>
                      <th scope="col" className="py-2 text-right font-semibold">Gastos</th>
                      <th scope="col" className="py-2 text-right font-semibold">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((month) => (
                      <tr key={month.period} className="border-b border-border/50 last:border-0">
                        <td className="py-2 capitalize">{month.label}</td>
                        <td className="py-2 text-right"><MoneyAmount amount={month.income} currency={currencyCode} variant="compact" /></td>
                        <td className="py-2 text-right"><MoneyAmount amount={month.expense} currency={currencyCode} variant="compact" /></td>
                        <td className="py-2 text-right"><MoneyAmount amount={month.net} currency={currencyCode} variant="compact" sign="always" tone="auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* §9.9: por debajo del mínimo de movimientos mostramos los totales pero no afirmamos tendencia. */}
          {coverage.sufficientData ? (
            <InsightCard title="Lectura del mes">
              {Number(kpis.savings) >= 0 ? (
                <p>
                  Tu resultado del mes fue{" "}
                  <strong className="text-foreground">
                    <MoneyAmount amount={kpis.savings} currency={currencyCode} variant="compact" sign="always" />
                  </strong>
                  {kpis.savingsRate === null ? "" : ` — el ${kpis.savingsRate}% de lo que ingresó`}.{" "}
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
          ) : (
            <p className="rounded-md bg-muted/40 px-3 py-2 text-small text-muted-foreground">
              Todavía no hay suficientes movimientos en el período para describir una tendencia. Los totales de arriba reflejan lo que registraste hasta ahora.
            </p>
          )}
        </>
      )}
    </div>
  );
}
