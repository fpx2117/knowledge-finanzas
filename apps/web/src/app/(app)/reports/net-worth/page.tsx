import Link from "next/link";
import { HandCoinsIcon, WalletIcon, InfoIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createReportService } from "@/features/reports/services/report-service";
import { ReportsNav } from "@/features/reports/components/report-shared";

const service = createReportService();

// spec 08 §13 — Patrimonio. Evolución del saldo de tus cuentas menos deuda pendiente, POR MONEDA
// (§13.4: nunca un total combinado). §13.2 — no sobreprometer: no incluye activos/pasivos que no
// estén en KnowFinanzas.
export default async function NetWorthReportPage() {
  const user = await requireCurrentUser();
  const positions = await service.getNetPosition({ userId: user.id });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reportes / Patrimonio"
        description="Evolución del saldo de tus cuentas menos lo que debés."
        actions={<HeaderActions showPeriod={false} />}
      />
      <ReportsNav />

      <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <Tooltip>
          <TooltipTrigger aria-label="Qué incluye el patrimonio" className="text-muted-foreground hover:text-foreground">
            <InfoIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            No incluye activos o pasivos que no estén registrados en KnowFinanzas.
          </TooltipContent>
        </Tooltip>
        Cada moneda se muestra por separado — no se combinan sin una conversión explícita.
      </p>

      {positions.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="Todavía no hay cuentas"
          description="Cargá una cuenta para ver tu posición."
        />
      ) : (
        positions.map((position) => (
          <section key={position.currencyCode} aria-label={`Patrimonio en ${position.currencyCode}`} className="flex flex-col gap-3">
            <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
              {position.currencyCode} · {position.accountCount} {position.accountCount === 1 ? "cuenta" : "cuentas"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Activos líquidos" icon={WalletIcon} tone="positive" value={position.liquidAssets} currency={position.currencyCode} hint="Saldo de tus cuentas activas" />
              <StatCard
                label="Deuda pendiente"
                icon={HandCoinsIcon}
                tone={Number(position.debtOutstanding) > 0 ? "warning" : "neutral"}
                value={position.debtOutstanding}
                currency={position.currencyCode}
                hint="Cuotas y préstamos sin pagar"
              />
              <StatCard
                label="Patrimonio neto"
                value={position.netWorth}
                currency={position.currencyCode}
                tone={Number(position.netWorth) >= 0 ? "positive" : "negative"}
                hint="Activos líquidos menos deuda"
              />
            </div>
          </section>
        ))
      )}

      <SectionCard title="De dónde sale">
        <p className="text-small text-muted-foreground">
          Los activos líquidos se reconstruyen desde tus movimientos confirmados, cuenta por cuenta — mirá el detalle en{" "}
          <Link href="/accounts" className="font-medium text-brand hover:underline">Cuentas</Link>. La deuda pendiente es la
          suma de cuotas no pagadas en{" "}
          <Link href="/obligations" className="font-medium text-brand hover:underline">Obligaciones</Link>.
        </p>
      </SectionCard>
    </div>
  );
}
