import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { accountRepository } from "@know-finanzas/db";
import { isApplicationError } from "@know-finanzas/shared";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { createTransferService } from "@/features/transfers/services/transfer-service";
import { TransferActions } from "@/features/transfers/components/transfer-actions";

const service = createTransferService();

export default async function TransferDetailPage({ params }: { params: Promise<{ transferId: string }> }) {
  const { transferId } = await params;
  const user = await requireCurrentUser();

  let aggregate: Awaited<ReturnType<typeof service.getTransfer>>;
  try {
    aggregate = await service.getTransfer(user.id, transferId);
  } catch (error) {
    if (isApplicationError(error) && error.code === "TRANSFER_NOT_FOUND") notFound();
    throw error;
  }

  const { transfer, legs } = aggregate;
  const accounts = await accountRepository.listForUser(user.id, { includeArchived: true });
  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  const voided = legs.every((leg) => leg.status === "VOIDED");

  return (
    <div className="flex flex-col gap-8">
      <Link href="/transactions" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a transacciones
      </Link>

      <PageHeader
        title="Transferencia"
        description={formatLongDate(transfer.occurredAt)}
        actions={<TransferActions transferId={transfer.id} voided={voided} />}
      />

      <SectionCard title="Detalle">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col rounded-lg border border-border bg-secondary/40 p-3">
            <span className="text-caption uppercase tracking-wider text-muted-foreground">Desde</span>
            <span className="text-small font-medium text-foreground">{nameById.get(transfer.fromAccountId) ?? "Cuenta"}</span>
          </div>
          <ArrowRightIcon aria-hidden className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" />
          <div className="flex flex-1 flex-col rounded-lg border border-border bg-secondary/40 p-3">
            <span className="text-caption uppercase tracking-wider text-muted-foreground">Hacia</span>
            <span className="text-small font-medium text-foreground">{nameById.get(transfer.toAccountId) ?? "Cuenta"}</span>
          </div>
        </div>

        <dl className="mt-2 flex flex-col gap-3 border-t border-border pt-4 text-small">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Monto</dt>
            <dd>
              <MoneyAmount amount={transfer.amount} currency={transfer.currencyCode} className="text-metric font-medium" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Fecha</dt>
            <dd className="font-medium text-foreground">{formatLongDate(transfer.occurredAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Estado</dt>
            <dd>{voided ? <StatusChip tone="neutral">Anulada</StatusChip> : <StatusChip tone="positive">Registrada</StatusChip>}</dd>
          </div>
          {transfer.notes ? (
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <dt className="text-muted-foreground">Notas</dt>
              <dd className="text-foreground-secondary">{transfer.notes}</dd>
            </div>
          ) : null}
        </dl>
      </SectionCard>
    </div>
  );
}
