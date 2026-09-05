import Link from "next/link";
import { AlertTriangleIcon, CalendarClockIcon, HandCoinsIcon, ListChecksIcon } from "lucide-react";

import { Money } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { TabBar } from "@/components/shared/tab-bar";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate, relativeDueLabel } from "@/lib/format";
import { createDebtService, type DebtDetail } from "@/features/debts/services/debt-service";
import { createObligationReadModel } from "@/features/obligations/services/obligation-read-model";
import {
  groupObligationsTemporally,
  OBLIGATION_STATUS_META,
  OBLIGATION_TYPE_LABEL,
} from "@/features/obligations/components/obligations-shared";

const service = createDebtService();
const obligations = createObligationReadModel();

const DEBT_STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: "Al día", tone: "positive" },
  OVERDUE: { label: "Vencida", tone: "negative" },
  PAID: { label: "Pagada", tone: "info" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

const DEBT_TYPE_LABEL: Record<string, string> = {
  PERSONAL_LOAN: "Préstamo personal",
  PURCHASE_INSTALLMENTS: "Compra en cuotas",
  MONEY_OWED_TO_PERSON: "Plata que debo",
  SERVICE_DEBT: "Deuda de servicio",
  OTHER: "Otra",
};

const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// spec 05 §9 — la vista principal ("Todas") agrupa las obligaciones por *tiempo*, no por tipo
// (§9.5), sobre el read model unificado (deuda + suscripción + programado). Las pestañas Deudas /
// Pagadas conservan el registro específico de deudas para su gestión.
export default async function ObligationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "resumen" } = await searchParams;
  const user = await requireCurrentUser();
  const currency = user.baseCurrency;

  const [debts, model] = await Promise.all([
    service.listDebts(user),
    // 365 días: cubre "Este mes" y "Más adelante" (§9.5). La gracia de 90 días trae las vencidas.
    obligations.getObligations({ userId: user.id, timezone: user.timezone, baseCurrency: currency, horizonDays: 365 }),
  ]);

  if (debts.length === 0 && model.items.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Obligaciones"
          description="Anticipá tus próximos compromisos y mantené claro cuánto tenés pendiente."
          actions={
            <>
              <HeaderActions showPeriod={false} />
              <Button variant="ghost" render={<Link href="/obligations/subscriptions">Suscripciones</Link>} />
              <Button render={<Link href="/obligations/new">Nueva obligación</Link>} />
            </>
          }
        />
        <EmptyState
          icon={<HandCoinsIcon />}
          title="No tenés obligaciones registradas"
          description="Cargá tus préstamos, compras en cuotas y servicios para no perder de vista lo que viene."
          action={<Button render={<Link href="/obligations/new">Nueva obligación</Link>} />}
        />
      </div>
    );
  }

  const baseItems = model.items.filter((item) => item.currencyCode === currency);
  const sumRemaining = (predicate: (item: (typeof baseItems)[number]) => boolean) =>
    baseItems
      .filter(predicate)
      .reduce((total, item) => total.add(Money.fromString(item.remainingAmount, currency)), Money.zero(currency))
      .toString();

  const overdueTotal = sumRemaining((item) => item.isOverdue);
  const thisWeekTotal = sumRemaining((item) => item.status === "DUE_TODAY" || item.status === "DUE_SOON");
  const next30Total = sumRemaining((item) => !item.isOverdue && item.daysUntilDue <= 30);
  const needsAttention = model.items.filter(
    (item) => item.isOverdue || item.status === "PARTIALLY_PAID" || (item.isEstimated && item.daysUntilDue <= 3),
  );

  const tabs = [
    { key: "resumen", label: "Todas", href: "/obligations" },
    { key: "deudas", label: "Deudas", href: "/obligations?tab=deudas" },
    { key: "pagadas", label: "Pagadas", href: "/obligations?tab=pagadas" },
  ];

  const tableDebts =
    tab === "pagadas" ? debts.filter((d) => d.effectiveStatus === "PAID") : debts.filter((d) => d.effectiveStatus !== "CANCELLED");

  const groups = groupObligationsTemporally(model.items, model.today);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Obligaciones"
        description="Anticipá tus próximos compromisos y mantené claro cuánto tenés pendiente."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button variant="ghost" render={<Link href="/obligations/subscriptions">Suscripciones</Link>} />
            <Button render={<Link href="/obligations/new">Nueva obligación</Link>} />
          </>
        }
      />

      {/* §9.3 — hasta 4 KPI primarios, multimoneda separada */}
      <section aria-label="Resumen de obligaciones" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Próximos 30 días" icon={CalendarClockIcon} value={next30Total} currency={currency} hint="Lo que vence en el mes" />
        <StatCard
          label="Vencen esta semana"
          tone={Number(thisWeekTotal) > 0 ? "warning" : "neutral"}
          value={thisWeekTotal}
          currency={currency}
          hint="En los próximos 7 días"
        />
        <StatCard
          label="Atrasado"
          tone={Number(overdueTotal) > 0 ? "negative" : "neutral"}
          value={overdueTotal}
          currency={currency}
          hint="Vencido y sin pagar"
        />
        <StatCard label="Obligaciones activas" icon={ListChecksIcon}>
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{model.items.length}</span>
            <span className="text-small font-normal text-muted-foreground">en los próximos 12 meses</span>
          </span>
        </StatCard>
      </section>

      {model.excludedCurrencies.length > 0 ? (
        <p className="text-caption text-muted-foreground">
          Los totales de arriba son sólo en {currency}. También tenés obligaciones en {model.excludedCurrencies.join(", ")} — se listan
          abajo pero no se suman.
        </p>
      ) : null}

      <TabBar tabs={tabs} active={tab} />

      {tab === "resumen" ? (
        <>
          {/* §9.4 — sólo si hay algo accionable */}
          {needsAttention.length > 0 ? (
            <SectionCard title="Necesita atención" eyebrow={`${needsAttention.length}`}>
              <ul className="flex flex-col divide-y divide-border">
                {needsAttention.map((item) => (
                  <li
                    key={`${item.sourceType}-${item.sourceId}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        {item.href ? (
                          <Link href={item.href} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                            {item.title}
                          </Link>
                        ) : (
                          <span className="truncate text-small font-medium text-foreground">{item.title}</span>
                        )}
                        <span className="text-caption text-muted-foreground">
                          {item.isOverdue
                            ? `Venció el ${formatShortDate(item.dueDate)}`
                            : item.status === "PARTIALLY_PAID"
                              ? `Pago parcial · vence ${relativeDueLabel(item.dueDate, model.today)}`
                              : `Monto por confirmar · vence ${relativeDueLabel(item.dueDate, model.today)}`}
                        </span>
                      </span>
                    </span>
                    <MoneyAmount amount={item.remainingAmount} currency={item.currencyCode} variant="compact" className="shrink-0 text-small font-medium" />
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {/* §9.5 / §9.6 — lista agrupada por tiempo */}
          {groups.map((group) => (
            <SectionCard key={group.key} title={group.label} eyebrow={`${group.items.length}`} contentClassName="gap-0">
              <div className="-mx-5 overflow-x-auto sm:-mx-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Obligación</TableHead>
                      <TableHead className={`hidden sm:table-cell ${HEAD}`}>Tipo</TableHead>
                      <TableHead className={`hidden sm:table-cell ${HEAD}`}>Fecha</TableHead>
                      <TableHead className={`text-right ${HEAD}`}>Monto</TableHead>
                      <TableHead className={`pr-5 sm:pr-6 ${HEAD}`}>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item) => {
                      const meta = OBLIGATION_STATUS_META[item.status];
                      return (
                        <TableRow key={`${item.sourceType}-${item.sourceId}`} className="h-[52px] hover:bg-brand-subtle/60">
                          <TableCell className="pl-5 sm:pl-6">
                            {item.href ? (
                              <Link href={item.href} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                                {item.title}
                              </Link>
                            ) : (
                              <span className="text-small font-medium text-foreground">{item.title}</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden text-small text-muted-foreground sm:table-cell">
                            {OBLIGATION_TYPE_LABEL[item.type]}
                          </TableCell>
                          <TableCell className="hidden text-small text-muted-foreground sm:table-cell">{formatShortDate(item.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1">
                              {item.isEstimated ? <span className="text-caption text-muted-foreground">≈</span> : null}
                              <MoneyAmount amount={item.remainingAmount} currency={item.currencyCode} variant="compact" className="text-small font-medium" />
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 sm:pr-6">
                            <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          ))}
        </>
      ) : (
        <SectionCard title={tab === "pagadas" ? "Deudas pagadas" : "Deudas y préstamos"} contentClassName="gap-0">
          {tableDebts.length > 0 ? (
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Obligación</TableHead>
                    <TableHead className={`hidden sm:table-cell ${HEAD}`}>Tipo</TableHead>
                    <TableHead className={`hidden text-right md:table-cell ${HEAD}`}>Total</TableHead>
                    <TableHead className={`text-right ${HEAD}`}>Pendiente</TableHead>
                    <TableHead className={HEAD}>Estado</TableHead>
                    <TableHead className="w-8 pr-5 sm:pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableDebts.map((debt: DebtDetail) => {
                    const meta = DEBT_STATUS_META[debt.effectiveStatus];
                    return (
                      <TableRow key={debt.id} className="h-[52px] hover:bg-brand-subtle/60">
                        <TableCell className="pl-5 sm:pl-6">
                          <Link href={`/obligations/${debt.id}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                            {debt.name}
                          </Link>
                          {debt.creditor ? <span className="block text-caption text-muted-foreground">{debt.creditor}</span> : null}
                        </TableCell>
                        <TableCell className="hidden text-small text-muted-foreground sm:table-cell">
                          {DEBT_TYPE_LABEL[debt.type] ?? debt.type}
                        </TableCell>
                        <TableCell className="hidden text-right md:table-cell">
                          <MoneyAmount amount={debt.totalPayable} currency={debt.currencyCode} variant="compact" className="text-small text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-right">
                          <MoneyAmount amount={debt.remainingAmount} currency={debt.currencyCode} variant="compact" className="text-small font-medium" />
                        </TableCell>
                        <TableCell>
                          <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
                        </TableCell>
                        <TableCell className="pr-5 sm:pr-6">
                          <Link href={`/obligations/${debt.id}`} aria-label={`Ver ${debt.name}`} className="text-muted-foreground hover:text-foreground">
                            →
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-6 text-center text-small text-muted-foreground">Nada para mostrar acá.</p>
          )}
        </SectionCard>
      )}
    </div>
  );
}
