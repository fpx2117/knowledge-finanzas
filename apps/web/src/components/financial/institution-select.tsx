"use client";

import { FinanceIcon } from "@/design-system/icons";
import { InstitutionLogo } from "@/design-system/institutions";
import { INSTITUTIONS, getInstitution, type FinancialInstitution, type InstitutionKind } from "@/design-system/institutions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "all";

const KIND_LABEL: Record<InstitutionKind, string> = {
  BANK: "Bancos",
  WALLET: "Billeteras",
  BROKER: "Inversiones",
};

export function InstitutionSelect({
  value,
  onValueChange,
  institutions = INSTITUTIONS,
  kinds,
  placeholder = "Todas las entidades",
  className,
}: {
  /** Selected institution id, or null for "all". */
  value: string | null;
  onValueChange: (value: string | null) => void;
  /** Defaults to the full registry. */
  institutions?: readonly FinancialInstitution[];
  /** Restrict to certain kinds, e.g. ["BANK", "WALLET"]. */
  kinds?: InstitutionKind[];
  placeholder?: string;
  className?: string;
}) {
  const list = kinds ? institutions.filter((entry) => kinds.includes(entry.kind)) : institutions;
  const groups = (["BANK", "WALLET", "BROKER"] as InstitutionKind[])
    .map((kind) => ({ kind, items: list.filter((entry) => entry.kind === kind) }))
    .filter((group) => group.items.length > 0);

  return (
    <Select value={value ?? ALL} onValueChange={(next) => onValueChange(next && next !== ALL ? next : null)}>
      <SelectTrigger className={cn("h-10 min-w-52", className)} aria-label="Filtrar por entidad">
        <SelectValue>
          {(current) => {
            if (!current || current === ALL) {
              return (
                <>
                  <FinanceIcon name="bank" size="sm" variant="muted" />
                  <span className="truncate">{placeholder}</span>
                </>
              );
            }
            const entry = getInstitution(current);
            if (!entry) return <span className="truncate">{placeholder}</span>;
            return (
              <>
                <InstitutionLogo institution={entry.id} size="sm" />
                <span className="truncate">{entry.shortName}</span>
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-56">
        <SelectGroup>
          <SelectItem value={ALL}>
            <FinanceIcon name="bank" size="sm" variant="muted" />
            {placeholder}
          </SelectItem>
        </SelectGroup>
        {groups.map((group) => (
          <SelectGroup key={group.kind} className="border-t border-border pt-1">
            <p className="px-1.5 py-1 text-xs text-muted-foreground">{KIND_LABEL[group.kind]}</p>
            {group.items.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                <InstitutionLogo institution={entry.id} size="sm" />
                <span className="truncate text-sm text-foreground">{entry.name}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
