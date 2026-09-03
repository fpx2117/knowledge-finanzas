"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, SearchIcon } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/shared/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { TypeBadge } from "@/components/financial/type-badge";
import { MoneyAmount } from "@/components/financial/money-amount";
import { formatShortDate } from "@/lib/format";

export type TransactionRow = {
  id: string;
  occurredAt: string;
  description: string;
  merchant: string | null;
  categoryName: string | null;
  accountName: string;
  type: string;
  amount: string;
  currencyCode: string;
  status: "POSTED" | "VOIDED";
};

const HEAD = "text-caption font-semibold uppercase tracking-wider text-muted-foreground";

export function TransactionsTable({
  rows,
  page,
  prevHref,
  nextHref,
}: {
  rows: TransactionRow[];
  page: number;
  prevHref?: string;
  nextHref?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      row.description.toLowerCase().includes(q) ||
      (row.merchant ?? "").toLowerCase().includes(q) ||
      (row.categoryName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por descripción, comercio o categoría"
          aria-label="Buscar movimiento"
          className="h-10 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "Todavía no hay movimientos" : "Ningún movimiento coincide"}
          description={
            rows.length === 0
              ? "Registrá tu primer ingreso o gasto para empezar a ver tu actividad."
              : "Probá con otra búsqueda o cambiá los filtros."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD}>Fecha</TableHead>
                <TableHead className={HEAD}>Descripción</TableHead>
                <TableHead className={`hidden md:table-cell ${HEAD}`}>Categoría</TableHead>
                <TableHead className={`hidden lg:table-cell ${HEAD}`}>Cuenta</TableHead>
                <TableHead className={`hidden sm:table-cell ${HEAD}`}>Tipo</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Monto</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const kindNegative = row.type === "EXPENSE" || row.type === "LIABILITY_PAYMENT";
                return (
                  <TableRow key={row.id} className="h-[52px] hover:bg-brand-subtle/60">
                    <TableCell className="whitespace-nowrap text-small text-muted-foreground">{formatShortDate(row.occurredAt)}</TableCell>
                    <TableCell>
                      <Link href={`/transactions/${row.id}`} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                        {row.description}
                      </Link>
                      {row.merchant ? <span className="block text-caption text-muted-foreground">{row.merchant}</span> : null}
                    </TableCell>
                    <TableCell className="hidden text-small text-muted-foreground md:table-cell">{row.categoryName ?? "—"}</TableCell>
                    <TableCell className="hidden text-small text-muted-foreground lg:table-cell">{row.accountName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={row.type} />
                        {row.status === "VOIDED" ? <StatusChip tone="neutral">Anulado</StatusChip> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyAmount
                        amount={kindNegative && !row.amount.startsWith("-") ? `-${row.amount}` : row.amount}
                        currency={row.currencyCode}
                        variant="compact"
                        tone={kindNegative ? "negative" : row.type === "INCOME" || row.type === "REFUND" ? "positive" : "neutral"}
                        className="text-small font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/transactions/${row.id}`} aria-label={`Ver ${row.description}`} className="text-muted-foreground hover:text-foreground">
                        <ChevronRightIcon className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {(prevHref || nextHref) && (
        <div className="flex items-center justify-between">
          <span className="text-caption text-muted-foreground">Página {page}</span>
          <div className="flex gap-2">
            {prevHref ? (
              <Link href={prevHref} className="rounded-md border border-border px-3 py-1.5 text-small font-medium text-foreground hover:bg-secondary">
                Anterior
              </Link>
            ) : null}
            {nextHref ? (
              <Link href={nextHref} className="rounded-md border border-border px-3 py-1.5 text-small font-medium text-foreground hover:bg-secondary">
                Siguiente
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
