import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { createAccountBalanceQueries, db } from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate, relativeDueLabel } from "@/lib/format";
import { createObligationReadModel } from "@/features/obligations/services/obligation-read-model";
import {
  HorizonSelector,
  OBLIGATION_STATUS_META,
  OBLIGATION_TYPE_LABEL,
  parseHorizon,
} from "@/features/obligations/components/obligations-shared";

const obligations = createObligationReadModel();
const balances = createAccountBalanceQueries(db);

// spec 05 §10 "Próximas": qué compromisos afectan mi dinero en los próximos días.
// Confirmado y estimado nunca se suman en un mismo número (§10.3). El saldo
// proyectado descuenta sólo montos conocidos; lo estimado se muestra aparte (§10.4).
export default async function UpcomingObligationsPage({
  searchParams,
}: {
  searchParams: Promise<{ horizon?: string }>;
}) {
  const { horizon: horizonParam } = await searchParams;
  const horizonDays = parseHorizon(horizonParam);
  const user = await requireCurrentUser();

  const [model, liquidTotals] = await Promise.all([
    obligations.getObligations({
      userId: user.id,
      timezone: user.timezone,
      baseCurrency: user.baseCurrency,
      horizonDays,
    }),
    balances.getLiquidTotalsForUser(user.id),
  ]);

  const currency = user.baseCurrency;
  const baseTotals = model.totals.find((t) => t.currencyCode === currency);
  const confirmed = baseTotals?.confirmed ?? "0";
  const estimated = baseTotals?.estimated ?? "0";
  const liquid =
    liquidTotals.find((t) => t.currencyCode === currency)?.total ?? "0";

  const baseItems = model.items.filter(
    (item) => item.currencyCode === currency,
  );
  const projectedAfterKnown = Money.fromString(liquid, currency).subtract(
    Money.fromString(confirmed, currency),
  );
  const projectedWorstCase = projectedAfterKnown.subtract(
    Money.fromString(estimated, currency),
  );
  const hasEstimates = model.estimatedCount > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Obligaciones / Próximas"
        description={`Lo que vence en los próximos ${horizonDays} días.`}
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button
              variant="outline"
              render={<Link href="/obligations">Ver todas</Link>}
            />
          </>
        }
      />

      <HorizonSelector active={horizonDays} />

      {model.items.length === 0 ? (
        <EmptyState
          title="Nada a la vista"
          description={`No tenés obligaciones registradas que venzan en los próximos ${horizonDays} días.`}
          action={
            <Button
              render={<Link href="/obligations/new">Nueva obligación</Link>}
            />
          }
        />
      ) : (
        <>
          {/* §10.3 — confirmado y estimado, nunca en el mismo número */}
          <section
            aria-label="Resumen del horizonte"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <StatCard
              label="Comprometido confirmado"
              value={confirmed}
              currency={currency}
              hint="Montos ya conocidos (cuotas, alquiler…)"
            />
            <StatCard
              label="Estimado"
              tone="warning"
              value={estimated}
              currency={currency}
              hint={
                hasEstimates
                  ? `${model.estimatedCount} con monto aproximado`
                  : "Sin estimaciones"
              }
            />
            <StatCard label="Total de obligaciones">
              <span className="flex flex-col gap-0.5">
                <span className="text-metric font-medium text-foreground">
                  {model.items.length}
                </span>
                <span className="text-small font-normal text-muted-foreground">
                  en {horizonDays} días
                </span>
              </span>
            </StatCard>
          </section>

          {model.excludedCurrencies.length > 0 ? (
            <p className="text-caption text-muted-foreground">
              También tenés obligaciones en{" "}
              {model.excludedCurrencies.join(", ")} — se listan abajo pero no se
              suman a los totales (moneda distinta a {currency}).
            </p>
          ) : null}

          {/* §10.4 — línea temporal */}
          <SectionCard
            title="Línea temporal"
            eyebrow={`Hoy · saldo ${new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(liquid))}`}
          >
            <ul className="flex flex-col divide-y divide-border">
              {model.items.map((item) => {
                const meta = OBLIGATION_STATUS_META[item.status];
                return (
                  <li
                    key={`${item.sourceType}-${item.sourceId}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="truncate text-small font-medium text-foreground hover:text-brand hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="truncate text-small font-medium text-foreground">
                            {item.title}
                          </span>
                        )}
                        <span className="shrink-0 text-caption text-muted-foreground">
                          {OBLIGATION_TYPE_LABEL[item.type]}
                        </span>
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {formatShortDate(item.dueDate)} ·{" "}
                        {relativeDueLabel(item.dueDate, model.today)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {item.isEstimated ? (
                        <span className="text-caption text-muted-foreground">
                          ≈
                        </span>
                      ) : null}
                      <MoneyAmount
                        amount={item.remainingAmount}
                        currency={item.currencyCode}
                        variant="compact"
                        className="text-small font-medium"
                      />
                      <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
              <div className="flex items-center justify-between text-small">
                <span className="text-muted-foreground">
                  Saldo proyectado tras compromisos conocidos
                </span>
                <MoneyAmount
                  amount={projectedAfterKnown.toString()}
                  currency={currency}
                  variant="compact"
                  tone={
                    projectedAfterKnown.amount.isNegative()
                      ? "negative"
                      : "neutral"
                  }
                  className="font-semibold"
                />
              </div>
              {hasEstimates ? (
                <p className="text-caption text-muted-foreground">
                  Proyección parcial: {model.estimatedCount}{" "}
                  {model.estimatedCount === 1
                    ? "obligación tiene"
                    : "obligaciones tienen"}{" "}
                  un monto todavía por confirmar. Si se cumplen las
                  estimaciones, quedaría en{" "}
                  <MoneyAmount
                    amount={projectedWorstCase.toString()}
                    currency={currency}
                    variant="compact"
                    className="font-medium"
                  />
                  .
                </p>
              ) : null}
            </div>
          </SectionCard>

          {/* §10.5 — riesgo de saldo insuficiente (no sólo color, no alarmista) */}
          {projectedAfterKnown.amount.isNegative() ? (
            <div className="flex items-start gap-3 rounded-xl border border-warning-soft bg-warning-soft/40 p-4">
              <AlertTriangleIcon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-[var(--warning)]"
              />
              <div className="flex flex-col gap-1 text-small">
                <span className="font-medium text-foreground">
                  Podrías quedarte sin margen
                </span>
                <span className="text-muted-foreground">
                  Con los compromisos confirmados de los próximos {horizonDays}{" "}
                  días, tu saldo proyectado quedaría en{" "}
                  <MoneyAmount
                    amount={projectedAfterKnown.toString()}
                    currency={currency}
                    variant="compact"
                    className="font-medium text-foreground"
                  />
                  . Revisá si podés reprogramar algún vencimiento o registrar un
                  ingreso pendiente.
                </span>
              </div>
            </div>
          ) : null}

          {baseItems.length === 0 && model.items.length > 0 ? (
            <p className="text-caption text-muted-foreground">
              Ninguna de estas obligaciones está en {currency}; la proyección de
              saldo no aplica.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
