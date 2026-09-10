"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionListItem, type TxnKind } from "@/components/financial/transaction-list-item";
import { MerchantLogo } from "@/components/financial/merchant-logo";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TransactionRow = {
  id: string;
  occurredAt: string;
  description: string;
  merchant: string | null;
  merchantDomain?: string | null;
  categoryName: string | null;
  accountName: string;
  type: string;
  amount: string;
  currencyCode: string;
  status: "POSTED" | "VOIDED";
};

function toKind(type: string): TxnKind {
  if (type === "INCOME" || type === "REFUND") return "income";
  if (type === "EXPENSE" || type === "LIABILITY_PAYMENT") return "expense";
  if (type === "TRANSFER" || type === "TRANSFER_IN" || type === "TRANSFER_OUT") return "transfer";
  return "adjustment";
}

const CHIPS = [
  { id: "ALL", label: "Todos" },
  { id: "income", label: "Ingresos" },
  { id: "expense", label: "Gastos" },
  { id: "transfer", label: "Transferencias" },
] as const;

type ChipId = (typeof CHIPS)[number]["id"];

const PAGE = 25;

/** YYYY-MM-DD for an instant in the given IANA timezone. */
function ymdInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Coarse date bucket for a movement — matches the reference's "Hoy / Ayer / Esta semana …". */
function bucket(iso: string, todayYmd: string, timeZone: string): { key: string; label: string; order: number } {
  const monthYear = new Intl.DateTimeFormat("es-AR", { timeZone, month: "long", year: "numeric" });
  const d = new Date(iso);
  const rowYmd = ymdInTz(d, timeZone);
  const dayMs = (s: string) => Date.parse(`${s}T00:00:00Z`);
  const days = Math.round((dayMs(todayYmd) - dayMs(rowYmd)) / 86_400_000);
  if (days <= 0) return { key: "hoy", label: "Hoy", order: 0 };
  if (days === 1) return { key: "ayer", label: "Ayer", order: 1 };
  if (days < 7) return { key: "semana", label: "Esta semana", order: 2 };
  if (rowYmd.slice(0, 7) === todayYmd.slice(0, 7)) return { key: "mes", label: "Este mes", order: 3 };
  const key = rowYmd.slice(0, 7);
  const label = monthYear.format(d).replace(/^\w/, (c) => c.toUpperCase());
  return { key, label, order: 4 + Math.round(days / 30) };
}

/**
 * The movements list — reference `transaccion UI -DESKTOP .png`: a card with a search box and
 * quick chips, then rows grouped by date bucket ("Hoy", "Ayer", "Esta semana", months).
 */
export function TransactionsTable({
  rows,
  timezone,
  defaultChip = "ALL",
}: {
  rows: TransactionRow[];
  timezone?: string;
  defaultChip?: ChipId;
}) {
  const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dowDate = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }),
    [tz],
  );
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ChipId>(defaultChip);
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (chip !== "ALL" && toKind(row.type) !== chip) return false;
      if (!q) return true;
      return (
        row.description.toLowerCase().includes(q) ||
        (row.merchant ?? "").toLowerCase().includes(q) ||
        (row.categoryName ?? "").toLowerCase().includes(q) ||
        row.accountName.toLowerCase().includes(q)
      );
    });
  }, [rows, query, chip]);

  const visible = filtered.slice(0, limit);

  // The kind chips only help when the list actually mixes kinds (income / expense / transfer).
  const showChips = useMemo(() => {
    const kinds = new Set<TxnKind>();
    for (const row of rows) {
      kinds.add(toKind(row.type));
      if (kinds.size > 1) return true;
    }
    return false;
  }, [rows]);

  const groups = useMemo(() => {
    const todayYmd = ymdInTz(new Date(), tz);
    const map = new Map<string, { label: string; order: number; newest: string; rows: TransactionRow[] }>();
    for (const row of visible) {
      const b = bucket(row.occurredAt, todayYmd, tz);
      const g = map.get(b.key);
      if (g) {
        g.rows.push(row);
        if (row.occurredAt > g.newest) g.newest = row.occurredAt;
      } else {
        map.set(b.key, { label: b.label, order: b.order, newest: row.occurredAt, rows: [row] });
      }
    }
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [visible, tz]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
        <div className="relative">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE);
            }}
            placeholder="Buscar un movimiento…"
            aria-label="Buscar movimiento"
            className="h-10 pl-9"
          />
        </div>
        <div className={cn("flex-wrap gap-2", showChips ? "flex" : "hidden")}>
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setChip(c.id);
                setLimit(PAGE);
              }}
              aria-pressed={chip === c.id}
              className={cn(
                "rounded-full border px-3 py-1 text-caption font-semibold transition-colors",
                chip === c.id
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<SearchIcon />}
            title={rows.length === 0 ? "Tu historia empieza acá." : "No encontramos movimientos."}
            description={
              rows.length === 0
                ? "Registrá tus ingresos, gastos y transferencias para tener una visión clara de tu dinero."
                : "Probá con otra búsqueda, período o tipo de movimiento."
            }
          />
        </div>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className="flex items-baseline justify-between gap-3 bg-surface-secondary/60 px-4 py-2 sm:px-5">
                <span className="text-caption font-bold text-foreground">{group.label}</span>
                <span className="text-caption text-muted-foreground">
                  {dowDate.format(new Date(group.newest)).replace(/^\w/, (c) => c.toUpperCase())}
                </span>
              </div>
              <ul className="flex flex-col px-4 sm:px-5">
                {group.rows.map((row) => {
                  const kind = toKind(row.type);
                  const isTransfer = kind === "transfer";
                  const href = isTransfer
                    ? `/transactions/transfers/${row.id.replace(/^transfer-/, "")}`
                    : `/transactions/${row.id}`;
                  return (
                    <li key={row.id} className="border-b border-border-subtle last:border-0">
                      <Link href={href} className="block rounded-lg transition-colors hover:bg-brand-subtle/40">
                        <TransactionListItem
                          concept={row.merchant ?? row.description}
                          meta={isTransfer ? row.accountName : `${row.categoryName ?? "Sin categoría"} · ${row.accountName}`}
                          amount={row.amount}
                          currency={row.currencyCode}
                          kind={kind}
                          leading={row.merchant ? <MerchantLogo name={row.merchant} domain={row.merchantDomain} /> : undefined}
                          date={`${formatShortDate(row.occurredAt)} · ${row.currencyCode}${row.status === "VOIDED" ? " · anulado" : ""}`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {filtered.length > limit ? (
        <div className="border-t border-border-subtle bg-surface-secondary px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="text-caption font-semibold text-brand hover:underline"
          >
            Mostrar más ({filtered.length - limit} restantes)
          </button>
        </div>
      ) : filtered.length > PAGE ? (
        <div className="border-t border-border-subtle bg-surface-secondary px-5 py-2.5 text-center text-caption text-muted-foreground">
          {filtered.length} movimientos
        </div>
      ) : null}
    </div>
  );
}
