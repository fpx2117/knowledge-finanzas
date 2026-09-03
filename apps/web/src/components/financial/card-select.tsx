"use client";

import { FinanceIcon } from "@/design-system/icons";
import { InstitutionLogo } from "@/design-system/institutions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cardProductLabel, type CreditCardAccount } from "@/lib/finance/institution-accounts";
import { cn } from "@/lib/utils";

const ALL = "all";

export function CardSelect({
  cards,
  value,
  onValueChange,
  placeholder = "Todas las tarjetas",
  className,
}: {
  cards: CreditCardAccount[];
  /** Selected card id, or null for "all". */
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const byId = new Map(cards.map((card) => [card.id, card]));

  return (
    <Select value={value ?? ALL} onValueChange={(next) => onValueChange(next && next !== ALL ? next : null)}>
      <SelectTrigger className={cn("h-10 min-w-56", className)} aria-label="Filtrar por tarjeta">
        <SelectValue>
          {(current) => {
            if (!current || current === ALL) {
              return (
                <>
                  <FinanceIcon name="creditCard" size="sm" variant="muted" />
                  <span className="truncate">{placeholder}</span>
                </>
              );
            }
            const card = byId.get(current);
            if (!card) return <span className="truncate">{placeholder}</span>;
            return (
              <>
                <InstitutionLogo institution={card.institutionId} size="sm" />
                <span className="truncate">{card.institutionName}</span>
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-64">
        <SelectGroup>
          <SelectItem value={ALL}>
            <FinanceIcon name="creditCard" size="sm" variant="muted" />
            {placeholder}
          </SelectItem>
        </SelectGroup>
        {cards.length > 0 ? (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Tarjetas</SelectLabel>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id} className="py-1.5">
                  <InstitutionLogo institution={card.institutionId} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-foreground">{card.institutionName}</span>
                    <span className="truncate text-xs text-muted-foreground">{cardProductLabel(card)}</span>
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
