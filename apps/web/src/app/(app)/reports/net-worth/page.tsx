import Link from "next/link";
import { HandCoinsIcon, WalletIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { StatCard } from "@/components/shared/stat-card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { ExcludedCurrenciesNote, ReportsNav } from "@/features/reports/components/report-shared";
import { periodLabel } from "@/features/reports/components/report-format";

const service = createReportService();

// spec 14 §8 "/reports/net-worth" (P1) — activos líquidos menos deuda pendiente, en la moneda
// base. Nunca se combina con otras monedas (§22) — ver ExcludedCurrenciesNote.
export default async function NetWorthReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: periodParam } = await searchParams;
  const user = await requireCurrentUser();
  const report = await service.getReport({ userId: user.id, timezone: user.timezone, baseCurrency: user.baseCurrency, period: periodParam });
  const { currencyCode, netWorthDetail, coverage } = report;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Reportes / Patrimonio" description={`Tu posición neta — ${periodLabel(report.period)}.`} actions={<HeaderActions />} />
      <ReportsNav />
      <ExcludedCurrenciesNote currencies={coverage.excludedCurrencies} />

      <section aria-label="Patrimonio" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Activos líquidos" icon={WalletIcon} tone="positive" value={netWorthDetail.liquidAssets} currency={currencyCode} hint="Saldo de tus cuentas activas" />
        <StatCard label="Deuda pendiente" icon={HandCoinsIcon} tone={Number(netWorthDetail.debtOutstanding) > 0 ? "warning" : "neutral"} value={netWorthDetail.debtOutstanding} currency={currencyCode} hint="Cuotas y préstamos sin pagar" />
        <StatCard label="Patrimonio neto" value={netWorthDetail.netWorth} currency={currencyCode} tone={Number(netWorthDetail.netWorth) >= 0 ? "positive" : "negative"} hint="Activos líquidos menos deuda" />
      </section>

      <p className="text-caption text-muted-foreground">
        Ver el detalle en{" "}
        <Link href="/accounts" className="font-medium text-brand hover:underline">
          Cuentas
        </Link>{" "}
        y{" "}
        <Link href="/obligations" className="font-medium text-brand hover:underline">
          Obligaciones
        </Link>
        .
      </p>
    </div>
  );
}
