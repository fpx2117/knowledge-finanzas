import Link from "next/link";
import { LayersIcon, LandmarkIcon, PiggyBankIcon, WalletIcon } from "lucide-react";

import { accountRepository, createDebtSummaryQueries, db } from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
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

export default async function AccountsPage() {
  const user = await requireCurrentUser();

  const [accounts, debtRows] = await Promise.all([
    service.listAccounts(user.id, { includeArchived: true }),
    debtQueries.listDebtInputsForUser(user.id),
  ]);

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

  // Debt remaining in the primary currency.
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

  // Donut: distribution of the primary-currency balance across accounts.
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cuentas"
        description="Gestioná tus cuentas y entendé dónde está tu dinero."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button render={<Link href="/accounts/new">Nueva cuenta</Link>} />
          </>
        }
      />

      <section aria-label="Resumen de cuentas" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo total en cuentas" icon={WalletIcon} value={primaryTotal} currency={primaryCurrency} hint="Sumando tus cuentas activas" />
        <StatCard label="Cuentas activas" icon={LandmarkIcon}>
          <span className="flex flex-col gap-0.5">
            <span className="text-metric font-medium text-foreground">{active.length}</span>
            <span className="text-small font-normal text-muted-foreground">
              {currencyTotals.length} {currencyTotals.length === 1 ? "moneda" : "monedas"}
            </span>
          </span>
        </StatCard>
        <StatCard label="Monedas" icon={LayersIcon}>
          <span className="text-metric font-medium text-foreground">{currencyTotals.map((c) => c.currencyCode).join(" · ") || "—"}</span>
        </StatCard>
        <StatCard
          label="Deuda pendiente"
          icon={PiggyBankIcon}
          tone={Number(debtRemaining) > 0 ? "warning" : "neutral"}
          value={debtRemaining}
          currency={primaryCurrency}
          hint="Saldo pendiente de tus obligaciones"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
        <AccountsExplorer accounts={accounts} />

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
