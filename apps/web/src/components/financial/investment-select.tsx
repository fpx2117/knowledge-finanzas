"use client";

import { FinanceIcon } from "@/design-system/icons";
import { InstitutionLogo } from "@/design-system/institutions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVESTMENT_KIND_META, type InvestmentAccount, type InvestmentKind } from "@/lib/finance/institution-accounts";
import { cn } from "@/lib/utils";

const ALL = "all";
const KIND_ORDER: InvestmentKind[] = ["stocks", "bonds", "funds", "etf", "account"];

/** Filter investments by instrument kind (Acciones / Bonos / Fondos / ETFs / Cuenta). */
export function InvestmentKindSelect({
  value,
  onValueChange,
  className,
}: {
  value: InvestmentKind | null;
  onValueChange: (value: InvestmentKind | null) => void;
  className?: string;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onValueChange(next && next !== ALL ? (next as InvestmentKind) : null)}>
      <SelectTrigger className={cn("h-10 min-w-48", className)} aria-label="Filtrar inversiones">
        <SelectValue>
          {(current) => {
            if (!current || current === ALL) {
              return (
                <>
                  <FinanceIcon name="investments" size="sm" variant="muted" />
                  <span className="truncate">Todas las inversiones</span>
                </>
              );
            }
            const meta = INVESTMENT_KIND_META[current as InvestmentKind];
            return (
              <>
                <FinanceIcon name={meta.icon} size="sm" variant="muted" />
                <span className="truncate">{meta.label}</span>
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-52">
        <SelectItem value={ALL}>
          <FinanceIcon name="investments" size="sm" variant="muted" />
          Todas las inversiones
        </SelectItem>
        <SelectSeparator />
        {KIND_ORDER.map((kind) => (
          <SelectItem key={kind} value={kind}>
            <FinanceIcon name={INVESTMENT_KIND_META[kind].icon} size="sm" variant="muted" />
            {INVESTMENT_KIND_META[kind].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Filter by a specific investment account (broker / bank), institution as primary label. */
export function InvestmentAccountSelect({
  accounts,
  value,
  onValueChange,
  className,
}: {
  accounts: InvestmentAccount[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  className?: string;
}) {
  const byId = new Map(accounts.map((account) => [account.id, account]));

  return (
    <Select value={value ?? ALL} onValueChange={(next) => onValueChange(next && next !== ALL ? next : null)}>
      <SelectTrigger className={cn("h-10 min-w-56", className)} aria-label="Filtrar por cuenta de inversión">
        <SelectValue>
          {(current) => {
            if (!current || current === ALL) {
              return (
                <>
                  <FinanceIcon name="portfolio" size="sm" variant="muted" />
                  <span className="truncate">Todas las cuentas</span>
                </>
              );
            }
            const account = byId.get(current);
            if (!account) return <span className="truncate">Todas las cuentas</span>;
            return (
              <>
                <InstitutionLogo institution={account.institutionId} size="sm" />
                <span className="truncate">{account.institutionName}</span>
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-64">
        <SelectItem value={ALL}>
          <FinanceIcon name="portfolio" size="sm" variant="muted" />
          Todas las cuentas
        </SelectItem>
        {accounts.length > 0 ? (
          <>
            <SelectSeparator />
            <SelectGroup>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="py-1.5">
                  <InstitutionLogo institution={account.institutionId} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-foreground">{account.institutionName}</span>
                    <span className="truncate text-xs text-muted-foreground">{account.accountName ?? "Cuenta de inversión"}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}
