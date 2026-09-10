"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontalIcon } from "lucide-react";

import { fieldControlClass } from "@/components/shared/form-field";

type Option = { id: string; name: string };

const SORT_OPTIONS: Array<[string, string]> = [
  ["date_desc", "Más recientes"],
  ["date_asc", "Más antiguos"],
  ["amount_desc", "Mayor monto"],
  ["amount_asc", "Menor monto"],
];

// spec 03 §9.4/§9.7 — tipo, cuenta y orden. Navega con carga completa (no `router.push`): bajo
// Next 15.5 una navegación de cliente que sólo cambia el query string sobre una ruta con
// `loading.tsx` no se aplica — ver [[nextjs-15-5-revalidatepath-hang]]. Un cambio de filtro
// recarga la lista de todos modos.
export function TransactionsFilters({ accounts }: { accounts: Option[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const account = searchParams.get("account") ?? "ALL";
  const sort = searchParams.get("sort") ?? "date_desc";

  function go(key: string, value: string, resetToDefault: string) {
    const next = new URLSearchParams(searchParams);
    if (value === resetToDefault) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    window.location.assign(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = account !== "ALL" || sort !== "date_desc" || searchParams.has("category") || searchParams.has("type");

  function clearAll() {
    window.location.assign(pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="tx-account">Filtrar por cuenta</label>
      <select
        id="tx-account"
        value={account}
        onChange={(event) => go("account", event.target.value, "ALL")}
        className={`${fieldControlClass} h-10 w-auto min-w-[8.5rem] flex-1 sm:max-w-[12rem] sm:flex-none`}
      >
        <option value="ALL">Todas las cuentas</option>
        {accounts.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="tx-sort">Ordenar</label>
      <select
        id="tx-sort"
        value={sort}
        onChange={(event) => go("sort", event.target.value, "date_desc")}
        className={`${fieldControlClass} h-10 w-auto min-w-[8.5rem] flex-1 sm:max-w-[12rem] sm:flex-none`}
      >
        {SORT_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {hasFilters ? (
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto inline-flex items-center gap-1.5 text-caption font-semibold text-brand hover:underline"
        >
          <SlidersHorizontalIcon className="size-3.5" />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
