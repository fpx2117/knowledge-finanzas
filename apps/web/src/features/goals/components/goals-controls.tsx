import { cn } from "@/lib/utils";

// spec 07 §9.2/§9.3 — selector de orden y filtro de moneda. Server component con `<a>` (carga
// completa): bajo Next 15.5 una navegación de cliente que sólo cambia el query string no se
// aplica de forma fiable si el RSC nuevo es casi idéntico (p. ej. el orden por nombre coincide
// con el desempate por defecto) — ver [[nextjs-15-5-revalidatepath-hang]]. Un cambio de orden
// recarga la lista de todos modos.

export type GoalSort = "atencion" | "fecha" | "nombre" | "progreso";
export const GOAL_SORTS: Array<[GoalSort, string]> = [
  ["atencion", "Atención primero"],
  ["fecha", "Fecha objetivo"],
  ["progreso", "Más avanzadas"],
  ["nombre", "Nombre"],
];

function href(base: { status: string; sort: GoalSort; currency: string | null }, patch: Partial<typeof base>): string {
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  if (merged.status !== "todas") params.set("status", merged.status);
  if (merged.sort !== "atencion") params.set("sort", merged.sort);
  if (merged.currency) params.set("currency", merged.currency);
  const qs = params.toString();
  return qs ? `/goals?${qs}` : "/goals";
}

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-caption font-medium transition-colors",
    active ? "border-brand-border bg-brand-subtle text-brand" : "border-border text-foreground-secondary hover:bg-secondary",
  );

export function GoalsControls({
  status,
  sort,
  currency,
  currencies,
}: {
  status: string;
  sort: GoalSort;
  currency: string | null;
  /** Currencies present among active goals — the filter only shows with 2+. */
  currencies: string[];
}) {
  const base = { status, sort, currency };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ordenar metas">
        <span className="mr-1 text-caption text-muted-foreground">Ordenar:</span>
        {GOAL_SORTS.map(([value, label]) => (
          <a key={value} href={href(base, { sort: value })} aria-current={sort === value ? "true" : undefined} className={chip(sort === value)}>
            {label}
          </a>
        ))}
      </div>

      {currencies.length > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por moneda">
          <span className="mr-1 text-caption text-muted-foreground">Moneda:</span>
          <a href={href(base, { currency: null })} aria-current={currency === null ? "true" : undefined} className={chip(currency === null)}>
            Todas
          </a>
          {currencies.map((code) => (
            <a key={code} href={href(base, { currency: code })} aria-current={currency === code ? "true" : undefined} className={chip(currency === code)}>
              {code}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
