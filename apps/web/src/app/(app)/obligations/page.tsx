import Link from "next/link";
import { CalendarClockIcon, HandCoinsIcon, ListChecksIcon } from "lucide-react";

import { Money } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard } from "@/components/shared/insight-card";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { TabBar } from "@/components/shared/tab-bar";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate, relativeDueLabel } from "@/lib/format";
import { createDebtService, type DebtDetail } from "@/features/debts/services/debt-service";

const service = createDebtService();

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: "Al día", tone: "positive" },
  OVERDUE: { label: "Vencida", tone: "negative" },
  PAID: { label: "Pagada", tone: "info" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

const TYPE_LABEL: Record<string, string> = {
  PERSONAL_LOAN: "Préstamo personal",
  PURCHASE_INSTALLMENTS: "Compra en cuotas",
  MONEY_OWED_TO_PERSON: "Plata que debo",
  SERVICE_DEBT: "Deuda de servicio",
  OTHER: "Otra",
};

const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

function todayISO(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "resumen" } = await searchParams;
  const user = await requireCurrentUser();
  const debts = await service.listDebts(user);

  if (debts.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Obligaciones"
          description="Gestioná tus deudas, cuotas y pagos recurrentes."
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
          description="Cargá tus préstamos y compras en cuotas para no perder de vista lo que viene."
          action={<Button render={<Link href="/obligations/new">Nueva obligación</Link>} />}
        />
      </div>
    );
  }

  const today = todayISO(user.timezone);
  const horizon = addDaysISO(today, 30);
  const currency = debts[0].currencyCode;

  const activeDebts = debts.filter((d) => d.effectiveStatus === "ACTIVE" || d.effectiveStatus === "OVERDUE");
  const totalObligations = activeDebts
    .filter((d) => d.currencyCode === currency)
    .reduce((s, d) => s.add(Money.fromString(d.totalPayable, currency)), Money.zero(currency))
    .toString();
  const pending = activeDebts
    .filter((d) => d.currencyCode === currency)
    .reduce((s, d) => s.add(Money.fromString(d.remainingAmount, currency)), Money.zero(currency))
    .toString();

  type UpcomingRow = { debtId: string; debtName: string; dueDate: string; amount: string; currencyCode: string; overdue: boolean };
  const upcoming: UpcomingRow[] = debts
    .flatMap((debt) =>
      debt.installments
        .filter((i) => (i.effectiveStatus === "PENDING" || i.effectiveStatus === "PARTIALLY_PAID" || i.effectiveStatus === "OVERDUE"))
        .map((i) => ({
          debtId: debt.id,
          debtName: debt.name,
          dueDate: i.dueDate,
          amount: i.remainingAmount,
          currencyCode: debt.currencyCode,
          overdue: i.effectiveStatus === "OVERDUE",
        })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const next30 = upcoming.filter((u) => u.currencyCode === currency && u.dueDate <= horizon && !u.overdue);
  const next30Total = next30.reduce((s, u) => s.add(Money.fromString(u.amount, currency)), Money.zero(currency)).toString();
  const overdue = upcoming.filter((u) => u.overdue);
  const overdueTotal = overdue
    .filter((u) => u.currencyCode === currency)
    .reduce((s, u) => s.add(Money.fromString(u.amount, currency)), Money.zero(currency))
    .toString();

  const statusCounts = debts.reduce<Record<string, number>>((acc, d) => {
    acc[d.effectiveStatus] = (acc[d.effectiveStatus] ?? 0) + 1;
    return acc;
  }, {});
  const donutSegments: DonutSegment[] = [
    { key: "ACTIVE", color: "var(--success-vivid)" },
    { key: "OVERDUE", color: "var(--negative-vivid)" },
    { key: "PAID", color: "var(--chart-1)" },
    { key: "CANCELLED", color: "var(--muted-foreground)" },
  ]
    .filter((s) => (statusCounts[s.key] ?? 0) > 0)
    .map((s) => ({ label: STATUS_META[s.key].label, value: statusCounts[s.key] ?? 0, color: s.color }));

  const tabs = [
    { key: "resumen", label: "Resumen", href: "/obligations" },
    { key: "todas", label: "Todas", href: "/obligations?tab=todas" },
    { key: "pagadas", label: "Pagadas", href: "/obligations?tab=pagadas" },
  ];

  const tableDebts =
    tab === "pagadas" ? debts.filter((d) => d.effectiveStatus === "PAID") : tab === "todas" ? debts : debts.filter((d) => d.effectiveStatus !== "CANCELLED");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Obligaciones"
        description="Gestioná tus deudas, cuotas y pagos recurrentes."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button variant="ghost" render={<Link href="/obligations/subscriptions">Suscripciones</Link>} />
            <Button render={<Link href="/obligations/new">Nueva obligación</Link>} />
          </>
        }
      />

      <section aria-label="Resumen de obligaciones" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de obligaciones" icon={HandCoinsIcon} value={totalObligations} currency={currency} hint="Monto original a pagar" />
        <StatCard label="Pendiente de pago" icon={CalendarClockIcon} tone="warning" value={pending} currency={currency} hint="Lo que falta pagar" />
        <StatCard label="Próximos 30 días" tone={Number(next30Total) > 0 ? "warning" : "neutral"} value={next30Total} currency={currency} hint="Cuotas que vencen pronto" />
        <StatCard label="Obligaciones activas" icon={ListChecksIcon}>
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{activeDebts.length}</span>
            <span className="text-small font-normal text-muted-foreground">de {debts.length} en total</span>
          </span>
        </StatCard>
      </section>

      <TabBar tabs={tabs} active={tab} />

      <>
          {tab === "resumen" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
              <SectionCard title="Próximos vencimientos" action={{ label: "Ver próximas", href: "/obligations/upcoming" }}>
                {upcoming.filter((u) => !u.overdue).length > 0 ? (
                  <ul className="flex flex-col divide-y divide-border">
                    {upcoming
                      .filter((u) => !u.overdue)
                      .slice(0, 5)
                      .map((u, i) => (
                        <li key={`${u.debtId}-${i}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <span className="flex min-w-0 flex-col">
                            <Link href={`/obligations/${u.debtId}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                              {u.debtName}
                            </Link>
                            <span className="text-caption text-muted-foreground">
                              {formatShortDate(u.dueDate)} · {relativeDueLabel(u.dueDate, today)}
                            </span>
                          </span>
                          <MoneyAmount amount={u.amount} currency={u.currencyCode} variant="compact" className="text-small font-medium" />
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-small text-muted-foreground">No tenés cuotas por vencer.</p>
                )}
              </SectionCard>

              <div className="flex flex-col gap-4">
                <SectionCard title="Por estado">
                  <DonutChart segments={donutSegments} centerLabel="Obligaciones" centerValue={String(debts.length)} />
                </SectionCard>
                {overdue.length > 0 ? (
                  <InsightCard title="No te olvides">
                    <p>
                      Tenés {overdue.length} {overdue.length === 1 ? "cuota vencida" : "cuotas vencidas"} por{" "}
                      <strong className="text-foreground">
                        <MoneyAmount amount={overdueTotal} currency={currency} variant="compact" />
                      </strong>
                      .
                    </p>
                  </InsightCard>
                ) : (
                  <InsightCard title="Vas al día">
                    <p>No tenés cuotas vencidas. Seguí así.</p>
                  </InsightCard>
                )}
              </div>
            </div>
          ) : null}

          <SectionCard
            title={tab === "pagadas" ? "Obligaciones pagadas" : "Todas las obligaciones"}
            contentClassName="gap-0"
          >
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
                      const meta = STATUS_META[debt.effectiveStatus];
                      return (
                        <TableRow key={debt.id} className="h-[52px] hover:bg-brand-subtle/60">
                          <TableCell className="pl-5 sm:pl-6">
                            <Link href={`/obligations/${debt.id}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                              {debt.name}
                            </Link>
                            {debt.creditor ? <span className="block text-caption text-muted-foreground">{debt.creditor}</span> : null}
                          </TableCell>
                          <TableCell className="hidden text-small text-muted-foreground sm:table-cell">
                            {TYPE_LABEL[debt.type] ?? debt.type}
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
      </>
    </div>
  );
}
