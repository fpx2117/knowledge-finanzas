import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createDebtService } from "@/features/debts/services/debt-service";

const service = createDebtService();

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: "Al día", tone: "positive" },
  OVERDUE: { label: "Vencida", tone: "negative" },
  PAID: { label: "Pagada", tone: "info" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// WP-ROUTES-SUBVIEWS (spec 05 §8 "Cuotas"): compras en cuotas específicamente — el tipo
// PURCHASE_INSTALLMENTS — separado de préstamos personales/deudas con otra persona/servicios,
// que quedan en la vista general de Obligaciones.
export default async function InstallmentObligationsPage() {
  const user = await requireCurrentUser();
  const debts = await service.listDebts(user);
  const installmentDebts = debts.filter((d) => d.type === "PURCHASE_INSTALLMENTS");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Obligaciones / Cuotas" description="Tus compras en cuotas." />

      <SectionCard title="Compras en cuotas" eyebrow={`${installmentDebts.length}`} contentClassName="gap-0">
        {installmentDebts.length === 0 ? (
          <EmptyState title="Sin compras en cuotas" description="Cuando registres una compra en cuotas va a aparecer acá." />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Compra</TableHead>
                  <TableHead className={`hidden sm:table-cell ${HEAD}`}>Cuotas</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Total</TableHead>
                  <TableHead className={`hidden text-right sm:table-cell ${HEAD}`}>Pendiente</TableHead>
                  <TableHead className={`pr-5 sm:pr-6 ${HEAD}`}>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installmentDebts.map((debt) => {
                  const paid = debt.installments.filter((i) => i.effectiveStatus === "PAID").length;
                  const meta = STATUS_META[debt.effectiveStatus];
                  return (
                    <TableRow key={debt.id} className="h-[52px] hover:bg-brand-subtle/60">
                      <TableCell className="pl-5 sm:pl-6">
                        <Link href={`/obligations/${debt.id}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                          {debt.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-small text-muted-foreground sm:table-cell">
                        {paid} / {debt.installments.length}
                      </TableCell>
                      <TableCell className="text-right">
                        <MoneyAmount amount={debt.totalPayable} currency={debt.currencyCode} variant="compact" className="text-small text-muted-foreground" />
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        <MoneyAmount amount={debt.remainingAmount} currency={debt.currencyCode} variant="compact" className="text-small font-medium" />
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
        )}
      </SectionCard>
    </div>
  );
}
