import Link from "next/link";
import { LayersIcon, PiggyBankIcon, WalletIcon } from "lucide-react";

import { accountRepository, createDebtSummaryQueries, db } from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { InsightCard } from "@/components/shared/insight-card";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { AccountsExplorer } from "@/features/accounts/components/accounts-explorer";

const service = createAccountService({ accounts: accountRepository });
const debtQueries = createDebtSummaryQueries(db);

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export type AccountType = "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";

const TYPE_LABEL: Record<AccountType, string> = {
  BANK: "Bancos",
  DIGITAL_WALLET: "Billeteras",
  CASH: "Efectivo",
  SAVINGS: "Ahorro",
};

// WP-ROUTES-SUBVIEWS (spec 14 §7/§8): /accounts/{banks,wallets,cash,savings} are the same view
// as /accounts, scoped server-side to one account type — one body, parametrized, so the four
// subviews can never drift from the main page's logic (stats, donut, explorer all reuse this).
export async function AccountsView({ type }: { type?: AccountType }) {
  const user = await requireCurrentUser();
  // spec 02 §12.2 — the fixed header copy for the module.
  const title = type ? TYPE_LABEL[type] : "Cuentas";
  const description = "Administrá dónde está tu dinero y revisá qué movimientos explican cada saldo.";
  const breadcrumb = type ? [{ label: "Cuentas", href: "/accounts" }, { label: TYPE_LABEL[type] }] : undefined;

  const [allAccounts, debtRows] = await Promise.all([
    service.listAccounts(user.id, { includeArchived: true }),
    debtQueries.listDebtInputsForUser(user.id),
  ]);
  const accounts = type ? allAccounts.filter((a) => a.type === type) : allAccounts;

  const active = accounts.filter((a) => a.status === "ACTIVE");

  // Totals by currency.
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

  // Debt remaining in the primary currency — shown regardless of the account-type subview,
  // since obligations aren't scoped to one account type the way accounts are.
  const debtRemaining = debtRows
    .filter(
      (row) =>
        row.debt.currencyCode === primaryCurrency &&
        row.installment.status !== "PAID" &&
        row.installment.status !== "CANCELLED" &&
        row.debt.status !== "CANCELLED",
    )
    .reduce(
      (sum, row) =>
        sum.add(
          Money.fromString(row.installment.totalAmount, primaryCurrency).subtract(
            Money.fromString(row.allocatedAmount, primaryCurrency),
          ),
        ),
      Money.zero(primaryCurrency),
    )
    .toString();

  // Donut: distribution of the primary-currency balance across accounts (within this subview).
  const primaryAccounts = active
    .filter((a) => a.currencyCode === primaryCurrency && Number(a.balance) > 0)
    .sort((a, b) => Number(b.balance) - Number(a.balance));
  const primarySum = primaryAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const topAccounts = primaryAccounts.slice(0, 5);
  const otherAccounts = primaryAccounts.slice(5).reduce((s, a) => s + Number(a.balance), 0);
  const donutSegments: DonutSegment[] = [
    ...topAccounts.map((account, i) => ({ label: account.name, value: Number(account.balance), color: DONUT_COLORS[i] })),
    ...(otherAccounts > 0 ? [{ label: "Otras", value: otherAccounts, color: "var(--muted-foreground)" }] : []),
  ];

  const accountsPerCurrency = new Map<string, number>();
  for (const account of active) {
    accountsPerCurrency.set(account.currencyCode, (accountsPerCurrency.get(account.currencyCode) ?? 0) + 1);
  }
  const currencyList = currencyTotals.map((entry) => ({
    ...entry,
    count: accountsPerCurrency.get(entry.currencyCode) ?? 0,
  }));

  const multiCurrency = currencyTotals.length > 1;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        actions={<Button render={<Link href="/accounts/new">Nueva cuenta</Link>} />}
      />

      {/* spec 02 §12.3 — sólo mostrar métricas representables. Una moneda: un total. Varias: nunca
          un número único (sumaría monedas distintas — §10.3 / RF-03), sino saldos por moneda. */}
      <section aria-label="Resumen de cuentas" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {multiCurrency ? (
          <StatCard label="Saldos por moneda" icon={LayersIcon}>
            <ul className="mt-1 flex flex-col gap-1">
              {currencyTotals.map((entry) => (
                <li key={entry.currencyCode} className="flex items-baseline justify-between gap-3">
                  <span className="text-small font-medium text-muted-foreground">{entry.currencyCode}</span>
                  <MoneyAmount amount={entry.total} currency={entry.currencyCode} className="text-body-lg font-medium text-foreground" />
                </li>
              ))}
            </ul>
          </StatCard>
        ) : (
          <StatCard
            label="Saldo en cuentas"
            icon={WalletIcon}
            value={primaryTotal}
            currency={primaryCurrency}
            hint={`${active.length} ${active.length === 1 ? "cuenta activa" : "cuentas activas"}`}
          />
        )}
        <StatCard
          label="Deuda pendiente"
          icon={PiggyBankIcon}
          tone={Number(debtRemaining) > 0 ? "warning" : "neutral"}
          value={debtRemaining}
          currency={primaryCurrency}
          hint="Saldo pendiente de tus obligaciones · lo gestionás en Obligaciones"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <AccountsExplorer accounts={accounts} defaultType={type ?? "ALL"} />

        <div className="flex flex-col gap-4">
          <SectionCard title="Distribución por cuenta" eyebrow={primaryCurrency}>
            {donutSegments.length > 0 ? (
              <DonutChart
                segments={donutSegments}
                centerLabel="Total"
                centerValue={new Intl.NumberFormat("es-AR", { style: "currency", currency: primaryCurrency, maximumFractionDigits: 0 }).format(primarySum)}
              />
            ) : (
              <p className="py-6 text-center text-small text-muted-foreground">Sin saldos positivos para distribuir.</p>
            )}
          </SectionCard>

          <SectionCard title="Monedas">
            <ul className="flex flex-col divide-y divide-border">
              {currencyList.map((entry) => (
                <li key={entry.currencyCode} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-small font-medium text-foreground">{entry.currencyCode}</span>
                  <span className="flex items-center gap-3">
                    <MoneyAmount amount={entry.total} currency={entry.currencyCode} variant="compact" className="text-small" />
                    <span className="w-16 text-right text-caption text-muted-foreground">
                      {entry.count} {entry.count === 1 ? "cuenta" : "cuentas"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <InsightCard title="Tu dinero">
            <p>
              {primaryAccounts.length > 0
                ? `${topAccounts[0]?.name} concentra la mayor parte de tu saldo en ${primaryCurrency}.`
                : "Cuando registres saldos vas a ver acá cómo se reparte tu dinero."}
            </p>
          </InsightCard>
        </div>
      </div>
    </div>
  );
}
