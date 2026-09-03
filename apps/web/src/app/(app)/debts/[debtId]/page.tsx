import { notFound } from "next/navigation";

import { accountRepository } from "@know-finanzas/db";
import { isApplicationError } from "@know-finanzas/shared";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { ProgressBar } from "@/components/shared/progress-bar";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate } from "@/lib/format";
import { createDebtService } from "@/features/debts/services/debt-service";
import { DebtActions } from "@/features/debts/components/debt-actions";

const service = createDebtService();

const DEBT_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: "Al día", tone: "positive" },
  OVERDUE: { label: "Vencida", tone: "negative" },
  PAID: { label: "Pagada", tone: "info" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

const INSTALLMENT_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  PENDING: { label: "Pendiente", tone: "neutral" },
  PARTIALLY_PAID: { label: "Pago parcial", tone: "warning" },
  PAID: { label: "Pagada", tone: "positive" },
  OVERDUE: { label: "Vencida", tone: "negative" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

export default async function DebtDetailPage({ params }: { params: Promise<{ debtId: string }> }) {
  const { debtId } = await params;
  const user = await requireCurrentUser();

  let debt;
  try {
    debt = await service.getDebtDetail(user, debtId);
  } catch (error) {
    if (isApplicationError(error) && error.code === "INVALID_INPUT") notFound();
    throw error;
  }

  const accounts = await accountRepository.listForUser(user.id);
  const paidPct = Number(debt.totalPayable) > 0 ? (Number(debt.paidAmount) / Number(debt.totalPayable)) * 100 : 0;
  const meta = DEBT_STATUS[debt.effectiveStatus];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={debt.name}
        description={debt.creditor ? `Acreedor: ${debt.creditor} · ${debt.currencyCode}` : `Obligación · ${debt.currencyCode}`}
        actions={
          debt.effectiveStatus === "ACTIVE" || debt.effectiveStatus === "OVERDUE" ? (
            <DebtActions
              debtId={debt.id}
              currencyCode={debt.currencyCode}
              remainingAmount={debt.remainingAmount}
              accounts={accounts.map((a) => ({ id: a.id, name: a.name, currencyCode: a.currencyCode }))}
            />
          ) : undefined
        }
      />

      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Pendiente</span>
              <MoneyAmount amount={debt.remainingAmount} currency={debt.currencyCode} className="text-metric-xl font-medium" />
              <span className="text-small text-muted-foreground">
                Pagado <MoneyAmount amount={debt.paidAmount} currency={debt.currencyCode} variant="compact" className="text-small text-muted-foreground" /> de{" "}
                <MoneyAmount amount={debt.totalPayable} currency={debt.currencyCode} variant="compact" className="text-small text-muted-foreground" />
              </span>
            </div>
            <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
          </div>
          <ProgressBar value={paidPct} state="normal" aria-label={`${Math.round(paidPct)}% pagado`} />
          <span className="text-caption text-muted-foreground">{Math.round(paidPct)}% pagado</span>
        </CardContent>
      </Card>

      <SectionCard title="Calendario de cuotas" contentClassName="gap-0">
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Cuota</TableHead>
                <TableHead className={HEAD}>Vencimiento</TableHead>
                <TableHead className={`hidden text-right sm:table-cell ${HEAD}`}>Total</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Pendiente</TableHead>
                <TableHead className={`pr-5 sm:pr-6 ${HEAD}`}>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debt.installments.map((installment) => {
                const s = INSTALLMENT_STATUS[installment.effectiveStatus];
                return (
                  <TableRow key={installment.id} className="h-12 hover:bg-transparent">
                    <TableCell className="pl-5 text-small text-muted-foreground sm:pl-6">#{installment.installmentNumber}</TableCell>
                    <TableCell className="text-small text-foreground">{formatShortDate(installment.dueDate)}</TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      <MoneyAmount amount={installment.totalAmount} currency={debt.currencyCode} variant="compact" className="text-small text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyAmount amount={installment.remainingAmount} currency={debt.currencyCode} variant="compact" className="text-small font-medium" />
                    </TableCell>
                    <TableCell className="pr-5 sm:pr-6">
                      <StatusChip tone={s.tone}>{s.label}</StatusChip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
