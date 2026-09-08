"use client";

import { usePathname, useSearchParams } from "next/navigation";

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

  const type = searchParams.get("type") ?? "ALL";
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

  return (
    <div className="flex flex-wrap gap-3">
      <label className="sr-only" htmlFor="tx-type">Filtrar por tipo</label>
      <select
        id="tx-type"
        value={type}
        onChange={(event) => go("type", event.target.value, "ALL")}
        className={`${fieldControlClass} w-auto`}
      >
        <option value="ALL">Todos los tipos</option>
        <option value="INCOME">Ingresos</option>
        <option value="EXPENSE">Gastos</option>
      </select>

      <label className="sr-only" htmlFor="tx-account">Filtrar por cuenta</label>
      <select
        id="tx-account"
        value={account}
        onChange={(event) => go("account", event.target.value, "ALL")}
        className={`${fieldControlClass} w-auto`}
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
        className={`${fieldControlClass} w-auto`}
      >
        {SORT_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
