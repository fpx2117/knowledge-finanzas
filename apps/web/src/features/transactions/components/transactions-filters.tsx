"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

const TYPE_LABELS: Record<string, string> = { ALL: "Todos los tipos", INCOME: "Ingresos", EXPENSE: "Gastos" };

export function TransactionsFilters({ accounts }: { accounts: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "ALL";
  const account = searchParams.get("account") ?? "ALL";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "ALL") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={type} onValueChange={(value) => setParam("type", value ?? "ALL")}>
        <SelectTrigger className="h-10 w-40" aria-label="Filtrar por tipo">
          <SelectValue>{(value) => TYPE_LABELS[value] ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los tipos</SelectItem>
          <SelectItem value="INCOME">Ingresos</SelectItem>
          <SelectItem value="EXPENSE">Gastos</SelectItem>
        </SelectContent>
      </Select>

      <Select value={account} onValueChange={(value) => setParam("account", value ?? "ALL")}>
        <SelectTrigger className="h-10 w-48" aria-label="Filtrar por cuenta">
          <SelectValue>
            {(value) => (value === "ALL" ? "Todas las cuentas" : accounts.find((a) => a.id === value)?.name ?? "Cuenta")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas las cuentas</SelectItem>
          {accounts.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
