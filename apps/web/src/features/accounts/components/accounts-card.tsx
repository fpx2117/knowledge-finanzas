"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/shared/form-field";
import { MoneyAmount } from "@/components/financial/money-amount";
import { InstitutionLogo } from "@/design-system/institutions/institution-logo";
import { resolveAccountInstitution } from "@/design-system/institutions/institutions";
import { FinanceIcon } from "@/design-system/icons/finance-icon";
import { cn } from "@/lib/utils";

export type AccountCardRow = {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
  institution: string | null;
  currencyCode: string;
  balance: string;
  /** e.g. "Transferencia recibida · hoy" */
  lastMovement: string | null;
  /** ARS-equivalent line for non-primary currencies, already formatted. */
  approxInPrimary: string | null;
};

const TYPE_LABEL: Record<AccountCardRow["type"], string> = {
  CASH: "Billetera física",
  BANK: "Caja de ahorro",
  DIGITAL_WALLET: "Cuenta virtual",
  SAVINGS: "Caja de ahorro",
};

const TYPE_ICON = {
  CASH: "cash",
  BANK: "bank",
  DIGITAL_WALLET: "digitalWallet",
  SAVINGS: "savingsAccount",
} as const;

// Etiquetas cortas para el filtro por tipo (antes eran 4 subpáginas /accounts/{banks,…}).
const TYPE_FILTER_LABEL: Record<AccountCardRow["type"], string> = {
  BANK: "Bancos",
  DIGITAL_WALLET: "Billeteras",
  CASH: "Efectivo",
  SAVINGS: "Ahorro",
};
const TYPE_ORDER: AccountCardRow["type"][] = ["BANK", "DIGITAL_WALLET", "SAVINGS", "CASH"];

/**
 * The dominant "Tus cuentas" panel on the Cuentas screen (see `CUENTA - UI desktop.png`):
 * search + currency segmented control + "Nueva cuenta", then one large row per account.
 * This is the screen's ONLY account listing — archived accounts fold in behind a toggle
 * instead of being repeated in a second table.
 */
export function AccountsCard({ accounts, archived = [] }: { accounts: AccountCardRow[]; archived?: AccountCardRow[] }) {
  const [query, setQuery] = useState("");
  const [currency, setCurrency] = useState<string>("ALL");
  const [type, setType] = useState<"ALL" | AccountCardRow["type"]>("ALL");
  const [showArchived, setShowArchived] = useState(false);

  const currencies = useMemo(
    () => [...new Set([...accounts, ...archived].map((a) => a.currencyCode))].sort(),
    [accounts, archived],
  );
  const types = useMemo(() => {
    const present = new Set([...accounts, ...archived].map((a) => a.type));
    return TYPE_ORDER.filter((t) => present.has(t));
  }, [accounts, archived]);

  const matches = (account: AccountCardRow) => {
    if (currency !== "ALL" && account.currencyCode !== currency) return false;
    if (type !== "ALL" && account.type !== type) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return account.name.toLowerCase().includes(q) || (account.institution ?? "").toLowerCase().includes(q);
  };

  const activeRows = accounts.filter(matches);
  const archivedRows = archived.filter(matches);

  return (
    <section
      aria-label="Listado de cuentas"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-md)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 pt-5 sm:px-6">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-brand">
          <FinanceIcon name="wallet" size="sm" className="text-current" />
        </span>
        <h2 className="text-h3 text-foreground">Tus cuentas</h2>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cuentas por nombre o banco…"
            aria-label="Buscar cuentas"
            className="h-10 pl-9"
          />
        </div>
        {types.length > 1 ? (
          <>
            <label className="sr-only" htmlFor="account-type-filter">
              Filtrar por tipo de cuenta
            </label>
            <select
              id="account-type-filter"
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className={cn(fieldControlClass, "h-10 w-auto sm:w-[9.5rem]")}
            >
              <option value="ALL">Todos los tipos</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {TYPE_FILTER_LABEL[t]}
                </option>
              ))}
            </select>
          </>
        ) : null}
        {currencies.length > 1 ? (
          <div className="flex items-center gap-1 rounded-lg bg-surface-secondary p-1">
            {["ALL", ...currencies].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                aria-pressed={currency === code}
                className={cn(
                  "rounded-md px-3 py-1.5 text-caption font-semibold transition-colors",
                  currency === code ? "bg-card text-brand shadow-[var(--shadow-sm)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {code === "ALL" ? "Todas" : code}
              </button>
            ))}
          </div>
        ) : null}
        <Button render={<Link href="/accounts/new"><PlusIcon className="size-4" /> Nueva cuenta</Link>} />
      </div>

      {/* Rows */}
      {activeRows.length === 0 && archivedRows.length === 0 ? (
        <p className="border-t border-border-subtle px-6 py-10 text-center text-small text-muted-foreground">
          Ninguna cuenta coincide con el filtro.
        </p>
      ) : (
        <ul className="flex flex-col border-t border-border-subtle">
          {activeRows.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
          {showArchived ? archivedRows.map((account) => <AccountRow key={account.id} account={account} archived />) : null}
        </ul>
      )}

      {archived.length > 0 ? (
        <div className="border-t border-border-subtle px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            aria-expanded={showArchived}
            className="text-caption font-semibold text-brand hover:underline"
          >
            {showArchived ? "Ocultar archivadas" : `Ver archivadas (${archived.length})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AccountRow({ account, archived = false }: { account: AccountCardRow; archived?: boolean }) {
  const institution = resolveAccountInstitution(account);
  return (
    <li className="border-b border-border-subtle last:border-0">
      <Link
        href={`/accounts/${account.id}`}
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-brand-subtle/40 sm:px-6 sm:grid-cols-[auto_1.4fr_1fr_1.3fr_auto_auto]",
          archived && "opacity-60",
        )}
      >
        {institution ? (
          <InstitutionLogo institution={institution.id} size="lg" className="row-span-2 sm:row-span-1" />
        ) : (
          <span aria-hidden className="row-span-2 grid size-11 place-items-center rounded-xl bg-brand-subtle text-brand sm:row-span-1">
            <FinanceIcon name={TYPE_ICON[account.type]} size="sm" className="text-current" />
          </span>
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-small font-bold text-foreground">{account.name}</span>
          <span className="text-caption text-muted-foreground">
            {TYPE_LABEL[account.type]} · {account.currencyCode}
          </span>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              archived ? "bg-surface-secondary text-muted-foreground" : "bg-surface-secondary text-foreground-secondary",
            )}
          >
            <span className={cn("size-1.5 rounded-full", archived ? "bg-muted-foreground/50" : "bg-muted-foreground")} />
            {archived ? "Archivada" : "Manual"}
          </span>
        </div>

        <div className="hidden flex-col gap-0.5 sm:flex">
          <span className="text-caption text-muted-foreground">Saldo disponible</span>
          <MoneyAmount amount={account.balance} currency={account.currencyCode} variant="compact" className="text-body-lg font-bold text-foreground" />
          {account.approxInPrimary ? <span className="text-caption text-muted-foreground">≈ {account.approxInPrimary}</span> : null}
        </div>

        <div className="col-start-2 flex flex-col gap-0.5 sm:col-auto">
          <span className="hidden text-caption text-muted-foreground sm:inline">Último movimiento</span>
          <span className="truncate text-caption text-foreground-secondary sm:text-small">
            {account.lastMovement ?? "Sin movimientos"}
          </span>
          <MoneyAmount
            amount={account.balance}
            currency={account.currencyCode}
            variant="compact"
            className="text-small font-bold text-foreground sm:hidden"
          />
        </div>

        <span className="hidden items-center gap-0.5 whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-caption font-semibold text-brand transition-colors hover:bg-brand-subtle sm:inline-flex">
          Ver movimientos
        </span>
        <ChevronRightIcon aria-hidden className="row-span-2 size-4 shrink-0 text-muted-foreground/60 sm:row-span-1" />
      </Link>
    </li>
  );
}
