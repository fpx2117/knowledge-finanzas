import { ArrowDownRightIcon, ArrowUpRightIcon, PiggyBankIcon, WalletIcon, LineChartIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { InsightCard } from "@/components/shared/insight-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TabBar } from "@/components/shared/tab-bar";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { BarComparisonChart } from "@/components/charts/bar-comparison-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService, type CategorySlice, type ReportTab } from "@/features/reports/services/report-service";

const service = createReportService();

const TABS: Array<{ key: ReportTab; label: string; ready: boolean }> = [
  { key: "resumen", label: "Resumen", ready: true },
  { key: "flujo", label: "Flujo de caja", ready: false },
  { key: "gastos", label: "Gastos", ready: true },
  { key: "ingresos", label: "Ingresos", ready: true },
  { key: "patrimonio", label: "Patrimonio", ready: false },
  { key: "deudas", label: "Deudas", ready: false },
  { key: "comparativos", label: "Comparativos", ready: false },
];

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)", "var(--chart-4)", "var(--muted-foreground)"];

function periodLabel(period: string): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [year, month] = period.split("-").map(Number);
  return `${months[(month ?? 1) - 1]} de ${year}`;
}

function compactTotal(slices: CategorySlice[], currency: string): string {
  const total = slices.reduce((sum, slice) => sum + Number(slice.amount), 0);
  return `${currency} ${Math.round(total).toLocaleString("es-AR")}`;
}

function toSegments(slices: CategorySlice[]): DonutSegment[] {
  const top = slices.slice(0, 5);
  const rest = slices.slice(5);
  const restTotal = rest.reduce((sum, slice) => sum + Number(slice.amount), 0);
  const segments = top.map((slice, index) => ({
    label: slice.name,
    value: Number(slice.amount),
    color: DONUT_COLORS[index],
    display: `${Math.round(slice.share * 100)}%`,
  }));
  if (restTotal > 0) {
    segments.push({ label: `Otros (${rest.length})`, value: restTotal, color: DONUT_COLORS[5], display: `${Math.round((restTotal / slices.reduce((s, x) => s + Number(x.amount), 0)) * 100)}%` });
  }
  return segments;
}

function BreakdownTable({ slices, currency, emptyLabel }: { slices: CategorySlice[]; currency: string; emptyLabel: string }) {
  if (slices.length === 0) {
    return <p className="py-6 text-center text-small text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {slices.map((slice) => (
        <li key={slice.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-small font-medium text-foreground">{slice.name}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              <MoneyAmount amount={slice.amount} currency={currency} variant="compact" className="text-small font-medium" />
              <span className="w-9 text-right text-caption tabular-nums text-muted-foreground">{Math.round(slice.share * 100)}%</span>
            </span>
          </div>
          <ProgressBar value={slice.share * 100} aria-label={`${slice.name}: ${Math.round(slice.share * 100)}%`} />
        </li>
      ))}
    </ul>
  );
}

function NotReady({ label }: { label: string }) {
  return (
    <EmptyState
      icon={<LineChartIcon />}
      title={`${label} en preparación`}
      description="Esta vista del reporte llega en una próxima iteración. Mientras tanto, el Resumen ya cubre ingresos, gastos, ahorro y patrimonio del mes."
    />
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; tab?: string }> }) {
  const { period: periodParam, tab: tabParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });

  const activeTab = (TABS.find((tab) => tab.key === tabParam)?.key ?? "resumen") as ReportTab;
  const { currencyCode, kpis, months, expenseByCategory, incomeByCategory } = report;

  const periodQuery = periodParam ? `&period=${periodParam}` : "";
  const tabs = TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: tab.key === "resumen" ? `/reports${periodParam ? `?period=${periodParam}` : ""}` : `/reports?tab=${tab.key}${periodQuery}`,
  }));

  const hasData = Number(kpis.income) > 0 || Number(kpis.expense) > 0 || months.some((m) => Number(m.income) > 0 || Number(m.expense) > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes"
        description={`Análisis de tus finanzas — ${periodLabel(report.period)}.`}
        actions={<HeaderActions />}
      />

      <TabBar tabs={tabs} active={activeTab} />

      {!hasData ? (
        <EmptyState
          icon={<LineChartIcon />}
          title="Todavía no hay datos para reportar"
          description="Cargá transacciones durante el mes y acá vas a ver la evolución, la distribución de gastos y tu ahorro."
        />
      ) : activeTab === "resumen" ? (
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
            <SectionCard title="Distribución de gastos" action={{ label: "Ver detalle", href: `/reports?tab=gastos${periodQuery}` }}>
              {expenseByCategory.length > 0 ? (
                <DonutChart segments={toSegments(expenseByCategory)} centerLabel="Gasto total" centerValue={compactTotal(expenseByCategory, currencyCode)} />
              ) : (
                <p className="py-6 text-center text-small text-muted-foreground">Sin gastos categorizados este mes.</p>
              )}
            </SectionCard>
            <SectionCard title="Top categorías de gasto">
              <BreakdownTable slices={expenseByCategory.slice(0, 6)} currency={currencyCode} emptyLabel="Sin gastos categorizados este mes." />
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
      ) : activeTab === "gastos" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
          <SectionCard title="Distribución de gastos" eyebrow={periodLabel(report.period)}>
            {expenseByCategory.length > 0 ? (
              <DonutChart segments={toSegments(expenseByCategory)} centerLabel="Gasto total" centerValue={compactTotal(expenseByCategory, currencyCode)} />
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">Sin gastos categorizados este mes.</p>
            )}
          </SectionCard>
          <SectionCard title="Gastos por categoría">
            <BreakdownTable slices={expenseByCategory} currency={currencyCode} emptyLabel="Sin gastos categorizados este mes." />
          </SectionCard>
        </div>
      ) : activeTab === "ingresos" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
          <SectionCard title="Origen de los ingresos" eyebrow={periodLabel(report.period)}>
            {incomeByCategory.length > 0 ? (
              <DonutChart segments={toSegments(incomeByCategory)} centerLabel="Ingreso total" centerValue={compactTotal(incomeByCategory, currencyCode)} />
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">Sin ingresos categorizados este mes.</p>
            )}
          </SectionCard>
          <SectionCard title="Ingresos por categoría">
            <BreakdownTable slices={incomeByCategory} currency={currencyCode} emptyLabel="Sin ingresos categorizados este mes." />
          </SectionCard>
        </div>
      ) : (
        <NotReady label={TABS.find((tab) => tab.key === activeTab)?.label ?? "Este reporte"} />
      )}
    </div>
  );
}
