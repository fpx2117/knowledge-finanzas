import Link from "next/link";
import { ArrowLeftRightIcon, ArrowRightIcon } from "lucide-react";

import { accountRepository, createTransferRepository, db } from "@know-finanzas/db";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { Pagination, paginate } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatShortDate } from "@/lib/format";
import { TransactionsSubnav } from "@/features/transactions/components/transactions-subnav";

const transferRepo = createTransferRepository(db);
const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

// spec 03 §12 — Transferencias: movimientos internos entre cuentas propias. Nunca ingreso ni
// gasto. Cada fila es una operación única con dos efectos enlazados.
export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireCurrentUser();
  const [transfers, accounts] = await Promise.all([
    transferRepo.listForUserWithStatus(user.id),
    accountRepository.listForUser(user.id, { includeArchived: true }),
  ]);
  const nameById = new Map(accounts.map((a) => [a.id, a.name]));
  const { page, totalPages, rows } = paginate(transfers, Number((await searchParams).page) || 1);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Transferencias"
        description="Movimientos entre tus cuentas. No cuentan como ingreso ni como gasto."
        actions={<Button render={<Link href="/transactions/transfers/new">Nueva transferencia</Link>} />}
      />

      <TransactionsSubnav />

      {transfers.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRightIcon />}
          title="Todavía no registraste transferencias"
          description="Cuando muevas dinero de una cuenta a otra, va a quedar registrado acá."
          action={<Button render={<Link href="/transactions/transfers/new">Nueva transferencia</Link>} />}
        />
      ) : (
        <SectionCard title="Todas" eyebrow={`${transfers.length}`} contentClassName="gap-0">
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`pl-5 sm:pl-6 ${HEAD}`}>Fecha</TableHead>
                  <TableHead className={HEAD}>Desde → Hacia</TableHead>
                  <TableHead className={`text-right ${HEAD}`}>Monto</TableHead>
                  <TableHead className={`pr-5 sm:pr-6 ${HEAD}`}>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((transfer) => (
                  <TableRow key={transfer.id} className="h-[52px] hover:bg-brand-subtle/60">
                    <TableCell className="pl-5 sm:pl-6">
                      <Link
                        href={`/transactions/transfers/${transfer.id}`}
                        className="text-small font-medium text-foreground hover:text-brand hover:underline"
                      >
                        {formatShortDate(transfer.occurredAt instanceof Date ? transfer.occurredAt.toISOString() : String(transfer.occurredAt))}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-small text-foreground">
                        {nameById.get(transfer.fromAccountId) ?? "Cuenta"}
                        <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                        {nameById.get(transfer.toAccountId) ?? "Cuenta"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyAmount amount={String(transfer.amount)} currency={transfer.currencyCode} variant="compact" className="text-small font-medium" />
                    </TableCell>
                    <TableCell className="pr-5 sm:pr-6">
                      <StatusChip tone={transfer.voided ? "neutral" : "positive"}>
                        {transfer.voided ? "Anulada" : "Registrada"}
                      </StatusChip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => (p > 1 ? `/transactions/transfers?page=${p}` : "/transactions/transfers")}
          />
        </SectionCard>
      )}
    </div>
  );
}
