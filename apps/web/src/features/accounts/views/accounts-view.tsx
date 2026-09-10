import Link from "next/link";
import {
  ArrowLeftRightIcon,
  ClockIcon,
  LandmarkIcon,
  LayersIcon,
  LightbulbIcon,
  PlusIcon,
  ScaleIcon,
  WalletIcon,
} from "lucide-react";

import { accountRepository, createActivityQueries, db } from "@know-finanzas/db";
import { Money, convertAmount, isConvertiblePair } from "@know-finanzas/finance";
import { formatDateInTimezone } from "@/lib/date";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { AccountsCard, type AccountCardRow } from "@/features/accounts/components/accounts-card";
import { TransferDialog } from "@/features/transfers/components/transfer-dialog";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import type { TxnKind } from "@/components/financial/transaction-list-item";
import { CurrencyFlag } from "@/components/financial/currency-flag";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { getBlueQuote } from "@/features/fx/services/fx-service";

const service = createAccountService({ accounts: accountRepository });
const activityQueries = createActivityQueries(db);

// Distribución por moneda — el modelo usa sólo tonos de azul.
const CURRENCY_COLORS = ["var(--brand)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const QUICK_TILE =
  "flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-center text-caption font-semibold text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-subtle/50 hover:text-brand";

export type AccountType = "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";

const TYPE_LABEL: Record<AccountType, string> = {
  BANK: "Bancos",
  DIGITAL_WALLET: "Billeteras",
  CASH: "Efectivo",
  SAVINGS: "Ahorro",
};

const KIND_LABEL: Record<string, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  adjustment: "Ajuste",
};

/** Friendly movement date: "Hoy · 18:42", "Ayer", or "6 sep". */
function friendlyMoment(occurredAt: Date | string, timeZone: string, withTime = false): string {
  const date = new Date(occurredAt);
  const ymd = formatDateInTimezone(date, timeZone);
  const today = formatDateInTimezone(new Date(), timeZone);
  const yesterday = formatDateInTimezone(new Date(Date.now() - 86_400_000), timeZone);
  if (ymd === today) {
    return withTime
      ? `Hoy · ${new Intl.DateTimeFormat("es-AR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(date)}`
      : "Hoy";
  }
  if (ymd === yesterday) return "Ayer";
  return new Intl.DateTimeFormat("es-AR", { timeZone, day: "numeric", month: "short" }).format(date);
}

function txnKind(type: string): TxnKind {
  if (type === "INCOME") return "income";
  if (type === "EXPENSE") return "expense";
  if (type === "TRANSFER" || type === "TRANSFER_IN" || type === "TRANSFER_OUT") return "transfer";
  return "adjustment";
}

// Consolidación 2026-09: una sola vista de Cuentas. El corte por tipo (antes /accounts/{banks,…})
// se hace client-side en la card "Tus cuentas".
export async function AccountsView() {
  const user = await requireCurrentUser();
  const description = "Administrá dónde está tu dinero y revisá qué movimientos explican cada saldo.";

  const [allAccounts, recentActivity, blueQuote] = await Promise.all([
    service.listAccounts(user.id, { includeArchived: true }),
    activityQueries.listRecentActivity(user.id, { limit: 300 }).catch(() => []),
    getBlueQuote().catch(() => null),
  ]);

  type ActivityRow = {
    id: string;
    accountId: string | null;
    accountName: string | null;
    currencyCode: string;
    type: string;
    amount: string | number;
    description: string | null;
    merchant: string | null;
    categoryName: string | null;
    occurredAt: Date | string | null;
  };
  const activity = recentActivity as ActivityRow[];

  // "Último movimiento" por cuenta — la lista viene ordenada por fecha desc.
  const lastByAccount = new Map<string, { label: string; date: string }>();
  for (const row of activity) {
    if (!row.accountId || lastByAccount.has(row.accountId) || !row.occurredAt) continue;
    const concept = row.merchant ?? row.description ?? KIND_LABEL[txnKind(row.type)] ?? "Movimiento";
    lastByAccount.set(row.accountId, {
      label: concept,
      date: friendlyMoment(row.occurredAt, user.timezone),
    });
  }

  const accounts = allAccounts;
  const active = accounts.filter((a) => a.status === "ACTIVE");
  const archivedCount = accounts.length - active.length;

  // Totales por moneda.
  const totalsByCurrency = new Map<string, Money>();
  for (const account of active) {
    const current = totalsByCurrency.get(account.currencyCode) ?? Money.zero(account.currencyCode);
    totalsByCurrency.set(account.currencyCode, current.add(Money.fromString(account.balance, account.currencyCode)));
  }
  const currencyTotals = [...totalsByCurrency.entries()]
    .map(([currencyCode, total]) => ({ currencyCode, total: total.toString() }))
    .sort((a, b) => Number(b.total) - Number(a.total));
  const primaryCurrency = currencyTotals[0]?.currencyCode ?? user.baseCurrency;
  const primaryTotal = currencyTotals.find((c) => c.currencyCode === primaryCurrency)?.total ?? "0";
  const secondary = currencyTotals.find((c) => c.currencyCode !== primaryCurrency) ?? null;

  // Filas para "Tus cuentas" — el único listado de cuentas de la pantalla.
  const toRow = (account: (typeof accounts)[number]): AccountCardRow => {
    const last = lastByAccount.get(account.id) ?? null;
    let approxInPrimary: string | null = null;
    if (
      account.currencyCode !== primaryCurrency &&
      blueQuote &&
      isConvertiblePair(account.currencyCode, primaryCurrency, blueQuote.fx)
    ) {
      const converted = convertAmount(account.balance, account.currencyCode, primaryCurrency, blueQuote.fx);
      approxInPrimary = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: primaryCurrency,
        maximumFractionDigits: 0,
      }).format(Number(converted));
    }
    return {
      id: account.id,
      name: account.name,
      type: account.type as AccountCardRow["type"],
      institution: account.institution ?? null,
      currencyCode: account.currencyCode,
      balance: account.balance,
      lastMovement: last ? `${last.label} · ${last.date}` : null,
      approxInPrimary,
    };
  };
  const accountRows = active.map(toRow);
  const archivedRows = accounts.filter((a) => a.status !== "ACTIVE").map(toRow);

  // Distribución por moneda — todo convertido a la moneda principal.
  const currencyDist = currencyTotals
    .map((entry, i) => {
      const inPrimary =
        entry.currencyCode === primaryCurrency
          ? Number(entry.total)
          : blueQuote && isConvertiblePair(entry.currencyCode, primaryCurrency, blueQuote.fx)
            ? Number(convertAmount(entry.total, entry.currencyCode, primaryCurrency, blueQuote.fx))
            : Number(entry.total);
      return { currencyCode: entry.currencyCode, native: entry.total, inPrimary, color: CURRENCY_COLORS[i % CURRENCY_COLORS.length] };
    })
    .filter((entry) => entry.inPrimary > 0);
  const distTotal = currencyDist.reduce((s, e) => s + e.inPrimary, 0);
  const money0 = (currency: string) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 });
  // Sólo la proporción — los montos por moneda ya están en los KPI, no se repiten acá.
  const donutSegments: DonutSegment[] = currencyDist.map((entry) => ({
    label: entry.currencyCode,
    value: entry.inPrimary,
    color: entry.color,
  }));

  // Tipos de cuenta.
  const typeCounts = new Map<AccountType, number>();
  for (const account of active) typeCounts.set(account.type as AccountType, (typeCounts.get(account.type as AccountType) ?? 0) + 1);
  const typeBars = (["BANK", "DIGITAL_WALLET", "SAVINGS", "CASH"] as AccountType[])
    .map((t) => ({ label: TYPE_LABEL[t], count: typeCounts.get(t) ?? 0 }))
    .filter((bar) => bar.count > 0);

  // Último movimiento (KPI).
  const lastMovement = activity[0] ?? null;
  const lastMovementConcept = lastMovement
    ? lastMovement.merchant ?? lastMovement.description ?? KIND_LABEL[txnKind(lastMovement.type)]
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cuentas"
        description={description}
        actions={
          <Button render={
            <Link href="/accounts/new">
              <PlusIcon className="size-4" /> Registrar cuenta
            </Link>
          } />
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          size="section"
          icon={<WalletIcon />}
          title="Todo empieza con una cuenta."
          description="Agregá dónde guardás tu dinero y su saldo inicial. No necesitás ingresar claves ni datos bancarios."
          action={<Button render={<Link href="/accounts/new">Agregar mi primera cuenta</Link>} />}
        />
      ) : (
        <>
          {/* KPI row — modelo CUENTA - UI desktop.png. Los saldos por moneda viven acá y en
              ningún otro lado de la pantalla (spec 02 §12.3: una moneda = un total; varias =
              un total POR moneda, nunca sumados). */}
          <section
            aria-label="Indicadores de cuentas"
            className={cn(
              "grid grid-cols-2 gap-3 sm:gap-4",
              secondary ? "xl:grid-cols-4" : "sm:grid-cols-3 xl:grid-cols-3",
            )}
          >
            <KpiCard
              label={`Total en ${primaryCurrency}`}
              icon={WalletIcon}
              tone="positive"
              value={primaryTotal}
              currency={primaryCurrency}
              hint={`${active.length} ${active.length === 1 ? "cuenta activa" : "cuentas activas"}`}
            />
            {secondary ? (
              <KpiCard
                label={`Total en ${secondary.currencyCode}`}
                iconNode={<CurrencyFlag code={secondary.currencyCode} />}
                tone="brand"
                value={secondary.total}
                currency={secondary.currencyCode}
                hint={
                  blueQuote && isConvertiblePair(secondary.currencyCode, primaryCurrency, blueQuote.fx)
                    ? `≈ ${money0(primaryCurrency).format(Number(convertAmount(secondary.total, secondary.currencyCode, primaryCurrency, blueQuote.fx)))}`
                    : undefined
                }
              />
            ) : null}
            <KpiCard
              label="Cuentas activas"
              icon={LandmarkIcon}
              tone="brand"
              display={String(active.length)}
              hint={archivedCount > 0 ? `${archivedCount} archivada${archivedCount === 1 ? "" : "s"}` : "Ninguna archivada"}
            />
            <KpiCard
              label="Último movimiento"
              icon={ClockIcon}
              tone="warning"
              display={lastMovement && lastMovement.occurredAt ? friendlyMoment(lastMovement.occurredAt, user.timezone, true) : "—"}
              hint={lastMovementConcept ?? "Sin movimientos aún"}
            />
          </section>

          {/* Cuerpo — panel dominante + rail derecho */}
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-4">
              <AccountsCard accounts={accountRows} archived={archivedRows} />

              {/* Tip de KnowFinanzas */}
              <div className="flex items-start gap-3 rounded-xl border border-brand/15 bg-brand-subtle/50 px-4 py-3.5">
                <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <LightbulbIcon className="size-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-small font-bold text-foreground">Tip de KnowFinanzas</p>
                  <p className="text-caption text-muted-foreground">
                    Mantené tus saldos al día registrando cada movimiento — así tus análisis de gasto son fieles a la realidad.
                  </p>
                  <Link href="/transactions/new" className="mt-1 inline-flex w-fit items-center gap-1 text-caption font-semibold text-brand hover:underline">
                    Registrar un movimiento →
                  </Link>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <SectionCard title="Distribución por moneda" icon={LayersIcon} eyebrow={`≈ ${primaryCurrency}`}>
                {donutSegments.length > 0 ? (
                  <DonutChart
                    segments={donutSegments}
                    centerLabel={`Total ${primaryCurrency}`}
                    centerValue={money0(primaryCurrency).format(distTotal)}
                    className="sm:!flex-col sm:!items-stretch sm:!gap-4"
                  />
                ) : (
                  <p className="py-6 text-center text-small text-muted-foreground">Sin saldos positivos para distribuir.</p>
                )}
              </SectionCard>

              {typeBars.length > 1 ? (
                <SectionCard title="Tipos de cuenta" icon={LandmarkIcon}>
                  <ul className="flex flex-col gap-3">
                    {typeBars.map((bar) => {
                      const pct = active.length > 0 ? Math.round((bar.count / active.length) * 100) : 0;
                      return (
                        <li key={bar.label} className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between text-caption">
                            <span className="font-medium text-foreground">{bar.label}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {bar.count} · {pct}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(pct, 4)}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </SectionCard>
              ) : null}

              <SectionCard title="Accesos rápidos" icon={ArrowLeftRightIcon}>
                <div className="grid grid-cols-3 gap-2">
                  <TransferDialog
                    accounts={active.map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode }))}
                    timezone={user.timezone}
                    trigger={
                      <button type="button" className={QUICK_TILE}>
                        <ArrowLeftRightIcon className="size-4" />
                        Transferir
                      </button>
                    }
                  />
                  {[
                    { label: "Agregar saldo", href: "/transactions/new", icon: PlusIcon },
                    { label: "Conciliar", href: "/transactions", icon: ScaleIcon },
                  ].map((quick) => (
                    <Link key={quick.label} href={quick.href} className={QUICK_TILE}>
                      <quick.icon className="size-4" />
                      {quick.label}
                    </Link>
                  ))}
                </div>
              </SectionCard>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
