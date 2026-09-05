import { notFound } from "next/navigation";

import { accountRepository, createActivityQueries, db } from "@know-finanzas/db";
import { Money } from "@know-finanzas/finance";
import { isApplicationError } from "@know-finanzas/shared";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { TransactionListItem, type TxnKind } from "@/components/financial/transaction-list-item";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate, formatShortDate } from "@/lib/format";
import { createAccountService } from "@/features/accounts/services/account-service";
import { AccountActions } from "@/features/accounts/components/account-actions";

const service = createAccountService({ accounts: accountRepository });
const activityQueries = createActivityQueries(db);

const TYPE_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  DIGITAL_WALLET: "Billetera digital",
  SAVINGS: "Ahorro",
};

const ACTIVITY_KIND: Record<string, TxnKind> = {
  INCOME: "income",
  REFUND: "income",
  ADJUSTMENT_IN: "adjustment",
  ADJUSTMENT_OUT: "adjustment",
  TRANSFER_IN: "transfer",
  TRANSFER_OUT: "transfer",
  EXPENSE: "expense",
  LIABILITY_PAYMENT: "expense",
};

export default async function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const user = await requireCurrentUser();

  let account;
  try {
    account = await service.getAccountOverview(user.id, accountId);
  } catch (error) {
    if (isApplicationError(error) && error.code === "ACCOUNT_NOT_FOUND") notFound();
    throw error;
  }

  const [[balanceInputs], movements] = await Promise.all([
    accountRepository.getBalanceInputsForUser(user.id, accountId),
    activityQueries.listRecentActivity(user.id, { accountId, limit: 8 }),
  ]);

  const income = Money.fromString(balanceInputs?.incomeTotal ?? "0", account.currencyCode)
    .add(Money.fromString(balanceInputs?.refundTotal ?? "0", account.currencyCode))
    .toString();
  const expense = Money.fromString(balanceInputs?.expenseTotal ?? "0", account.currencyCode).toString();
  const lastMovement = movements[0];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={account.name}
        description={`${TYPE_LABEL[account.type] ?? account.type} · ${account.currencyCode}`}
        actions={
          account.status === "ACTIVE" ? (
            <AccountActions accountId={account.id} accountName={account.name} balance={account.balance} currencyCode={account.currencyCode} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="[--card-spacing:--spacing(6)] lg:col-span-1">
          <CardContent className="flex flex-col gap-1">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Saldo actual</span>
            <MoneyAmount
              amount={account.balance}
              currency={account.currencyCode}
              tone={Number(account.balance) < 0 ? "negative" : "neutral"}
              className="text-metric-xl font-medium"
            />
            <div className="mt-3">
              <StatusChip tone={account.status === "ACTIVE" ? "positive" : "neutral"}>
                {account.status === "ACTIVE" ? "Activa" : "Archivada"}
              </StatusChip>
            </div>
          </CardContent>
        </Card>

        <Card className="[--card-spacing:--spacing(6)] lg:col-span-2">
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Detail label="Saldo inicial">
              <MoneyAmount amount={account.openingBalance} currency={account.currencyCode} variant="compact" className="text-small font-medium" />
              <span className="text-caption text-muted-foreground">{formatLongDate(account.openingDate)}</span>
            </Detail>
            <Detail label="Ingresos registrados">
              <MoneyAmount amount={income} currency={account.currencyCode} variant="compact" tone="positive" className="text-small font-medium" />
            </Detail>
            <Detail label="Gastos registrados">
              <MoneyAmount amount={expense} currency={account.currencyCode} variant="compact" tone="negative" className="text-small font-medium" />
            </Detail>
            <Detail label="Último movimiento">
              <span className="text-small font-medium text-foreground">
                {lastMovement ? formatShortDate(lastMovement.occurredAt) : "Sin movimientos"}
              </span>
            </Detail>
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Movimientos recientes" action={{ label: "Ver todos", href: `/transactions?account=${account.id}` }}>
        {movements.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {movements.map((movement) => (
              <li key={String(movement.id)}>
                <TransactionListItem
                  concept={String(movement.description ?? movement.merchant ?? "Movimiento")}
                  meta={`${movement.categoryName ? `${String(movement.categoryName)} · ` : ""}${formatShortDate(movement.occurredAt)}`}
                  amount={String(movement.amount)}
                  currency={String(movement.currencyCode)}
                  kind={ACTIVITY_KIND[String(movement.type)] ?? "expense"}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-small text-muted-foreground">Esta cuenta todavía no tiene movimientos.</p>
        )}
      </SectionCard>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
