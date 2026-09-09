import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { MoneyAmount } from "@/components/financial/money-amount";
import { BarComparisonChart } from "@/components/charts/bar-comparison-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { createReportService } from "@/features/reports/services/report-service";
import { ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { ReportCurrencyPicker } from "@/features/reports/components/report-currency-picker";
import { periodLabel } from "@/features/reports/components/report-format";

const service = createReportService();
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// spec 08 §12 — Flujo de caja. Dos dominios estrictamente separados (§12.2): REAL (histórico
// confirmado, mes a mes) y PROYECTADO (próximos 30 días: obligaciones + programados). El
// proyectado nunca se mezcla con la serie confirmada y siempre se etiqueta como proyección.
export default async function CashFlowReportPage({ searchParams }: { searchParams: Promise<{ period?: string; currency?: string }> }) {
  const { period: periodParam, currency: currencyParam } = await searchParams;
  const user = await requireCurrentUser();
  const currencies = await service.listReportCurrencies(user.id, user.baseCurrency);
  const currency = currencyParam && currencies.includes(currencyParam) ? currencyParam : user.baseCurrency;
  const [report, projection] = await Promise.all([
    service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, currency, period: periodParam }),
    service.getCashFlowProjection({ userId: user.id, timezone: user.timezone, baseCurrency: currency }),
  ]);
  const { currencyCode, months, coverage } = report;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Flujo de caja" description="Lo que ya pasó, y por separado lo que está previsto." actions={<HeaderActions />} />
      <ReportsNav />
      <ReportCurrencyPicker basePath="/reports/cash-flow" currencies={currencies} active={currencyCode} period={report.period} />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      {/* ── REAL ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Confirmado · últimos 6 meses</h2>
        <SectionCard title="Entradas y salidas" eyebrow={currencyCode}>
          <BarComparisonChart rows={months.map((month) => ({ label: month.label, income: Number(month.income), expense: Number(month.expense) }))} currency={currencyCode} />
        </SectionCard>

        <SectionCard title="Detalle mensual" contentClassName="gap-0">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Mes</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Entradas</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Salidas</TableHead>
                  <TableHead className={`pr-5 text-right sm:pr-6 ${HEAD}`}>Flujo neto</TableHead>
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

      {/* ── PROYECTADO ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-t-2 border-dashed border-border pt-8">
        <div>
          <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Proyección · próximos {projection?.horizonDays ?? 30} días</h2>
          <p className="text-caption text-muted-foreground">
            Estimación a partir de tus obligaciones y movimientos programados. No es dinero confirmado.
          </p>
        </div>

        {!projection ? (
          <SectionCard title="Sin datos para proyectar">
            <p className="text-small text-muted-foreground">Cargá una cuenta y alguna obligación o movimiento programado para ver la proyección.</p>
          </SectionCard>
        ) : (
          <>
            {projection.firstNegativeDate ? (
              <p role="alert" className="rounded-md bg-warning-soft px-3 py-2.5 text-small text-[var(--warning)]">
                Con los compromisos registrados, tu saldo proyectado podría quedar en{" "}
                <MoneyAmount amount={projection.minimumProjectedBalance} currency={projection.currencyCode} variant="compact" /> el{" "}
                {formatLongDate(projection.minimumBalanceDate)}.
              </p>
            ) : null}

            <section aria-label="Proyección de saldo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Saldo hoy" value={projection.startingBalance} currency={projection.currencyCode} hint="Saldo confirmado de tus cuentas" />
              <StatCard label="Entradas previstas" tone="positive" value={projection.totalInflow} currency={projection.currencyCode} hint="Ingresos programados" />
              <StatCard label="Salidas previstas" tone="negative" value={projection.totalOutflow} currency={projection.currencyCode} hint="Obligaciones y gastos programados" />
              <StatCard
                label="Saldo proyectado"
                tone={Number(projection.projectedEndBalance) >= 0 ? "positive" : "negative"}
                value={projection.projectedEndBalance}
                currency={projection.currencyCode}
                hint="Al final del horizonte"
              />
            </section>

            {projection.events.length > 0 ? (
              <SectionCard title="Eventos previstos" contentClassName="gap-0">
                <ul className="flex flex-col divide-y divide-border">
                  {projection.events.map((event, index) => (
                    <li key={`${event.date}-${index}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-small font-medium text-foreground">{event.title}</span>
                        <span className="text-caption text-muted-foreground">
                          {formatLongDate(event.date)} · {event.confidence === "COMMITTED" ? "compromiso" : "programado"}
                        </span>
                      </span>
                      <MoneyAmount
                        amount={event.direction === "OUTFLOW" ? `-${event.amount}` : event.amount}
                        currency={projection.currencyCode}
                        variant="compact"
                        sign="always"
                        tone="auto"
                        className="shrink-0 text-small font-medium"
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
