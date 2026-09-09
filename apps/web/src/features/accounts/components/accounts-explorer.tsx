"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BanknoteIcon, ChevronRightIcon, LandmarkIcon, PiggyBankIcon, SearchIcon, SmartphoneIcon, WalletIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/shared/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyAmount } from "@/components/financial/money-amount";
import { formatShortDate } from "@/lib/format";

type AccountRow = {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
  currencyCode: string;
  status: "ACTIVE" | "ARCHIVED";
  balance: string;
  lastActivityAt: string | null;
};

const TYPE_META: Record<AccountRow["type"], { label: string; icon: typeof WalletIcon }> = {
  CASH: { label: "Efectivo", icon: BanknoteIcon },
  BANK: { label: "Banco", icon: LandmarkIcon },
  DIGITAL_WALLET: { label: "Billetera digital", icon: SmartphoneIcon },
  SAVINGS: { label: "Ahorro", icon: PiggyBankIcon },
};

const SORTS: Record<string, (a: AccountRow, b: AccountRow) => number> = {
  name: (a, b) => a.name.localeCompare(b.name, "es"),
  "balance-desc": (a, b) => Number(b.balance) - Number(a.balance),
  "balance-asc": (a, b) => Number(a.balance) - Number(b.balance),
};

export function AccountsExplorer({ accounts, defaultType = "ALL" }: { accounts: AccountRow[]; defaultType?: string }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(defaultType);
  const [currency, setCurrency] = useState<string>("ALL");
  const [sort, setSort] = useState<string>("balance-desc");
  // spec 02 §12.4 — Estado oculto por defecto; se activa con "Ver archivadas".
  const [showArchived, setShowArchived] = useState(false);

  const currencies = useMemo(() => [...new Set(accounts.map((a) => a.currencyCode))].sort(), [accounts]);
  const archivedCount = useMemo(() => accounts.filter((a) => a.status === "ARCHIVED").length, [accounts]);

  const filtered = accounts
    .filter((account) => {
      if (!showArchived && account.status === "ARCHIVED") return false;
      if (query && !account.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (type !== "ALL" && account.type !== type) return false;
      if (currency !== "ALL" && account.currencyCode !== currency) return false;
      return true;
    })
    .sort(SORTS[sort] ?? SORTS["balance-desc"]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cuenta"
            aria-label="Buscar cuenta"
            className="h-10 pl-9"
          />
        </div>
        <Select value={type} onValueChange={(value) => setType(value ?? "ALL")}>
          <SelectTrigger className="h-10 sm:w-44" aria-label="Filtrar por tipo">
            <SelectValue>{(value) => (value === "ALL" ? "Todos los tipos" : TYPE_META[value as AccountRow["type"]]?.label)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {Object.entries(TYPE_META).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={(value) => setCurrency(value ?? "ALL")}>
          <SelectTrigger className="h-10 sm:w-44" aria-label="Filtrar por moneda">
            <SelectValue>{(value) => (value === "ALL" ? "Todas las monedas" : value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las monedas</SelectItem>
            {currencies.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value ?? "balance-desc")}>
          <SelectTrigger className="h-10 sm:w-44" aria-label="Ordenar">
            <SelectValue>
              {(value) =>
                value === "name" ? "Nombre (A–Z)" : value === "balance-asc" ? "Saldo (menor)" : "Saldo (mayor)"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance-desc">Saldo (mayor)</SelectItem>
            <SelectItem value="balance-asc">Saldo (menor)</SelectItem>
            <SelectItem value="name">Nombre (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {archivedCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="self-start text-caption font-medium text-brand hover:underline"
        >
          {showArchived ? "Ocultar archivadas" : `Ver archivadas (${archivedCount})`}
        </button>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title={accounts.length === 0 ? "Todavía no tenés cuentas" : "Ninguna cuenta coincide"}
          description={
            accounts.length === 0
              ? "Creá tu primera cuenta para empezar a ver tu posición."
              : "Probá con otros filtros o limpiá la búsqueda."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Cuenta</TableHead>
                <TableHead className="hidden text-caption font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Tipo</TableHead>
                <TableHead className="hidden text-caption font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Moneda</TableHead>
                <TableHead className="hidden text-caption font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Estado</TableHead>
                <TableHead className="text-right text-caption font-semibold uppercase tracking-wider text-muted-foreground">Saldo</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((account) => {
                const meta = TYPE_META[account.type];
                const Icon = meta.icon;
                return (
                  <TableRow key={account.id} className="h-[52px] hover:bg-brand-subtle/60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-brand">
                          <Icon className="size-4" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <Link href={`/accounts/${account.id}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                            {account.name}
                          </Link>
                          <span className="text-caption text-muted-foreground">
                            {account.lastActivityAt ? `Últ. mov. ${formatShortDate(account.lastActivityAt)}` : "Sin movimientos"}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-small text-muted-foreground sm:table-cell">{meta.label}</TableCell>
                    <TableCell className="hidden text-small text-muted-foreground md:table-cell">{account.currencyCode}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusChip tone={account.status === "ACTIVE" ? "positive" : "neutral"}>
                        {account.status === "ACTIVE" ? "Activa" : "Archivada"}
                      </StatusChip>
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyAmount
                        amount={account.balance}
                        currency={account.currencyCode}
                        variant="compact"
                        tone={Number(account.balance) < 0 ? "negative" : "neutral"}
                        className="text-small font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/accounts/${account.id}`} aria-label={`Ver ${account.name}`} className="text-muted-foreground hover:text-foreground">
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

      <p className="text-caption text-muted-foreground">
        Mostrando {filtered.length} de {accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}
      </p>
    </div>
  );
}
