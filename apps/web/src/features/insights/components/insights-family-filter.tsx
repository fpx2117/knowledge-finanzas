import { INSIGHT_FAMILY_META } from "@/features/insights/insight-meta";
import type { InsightFamily } from "@know-finanzas/finance";
import { cn } from "@/lib/utils";

// spec 09 §11.2 — "filtros discretos": chips por familia, sólo las presentes en la cola. Server
// component con `<a>` (carga completa): navegación query-only que no cambia mucho el RSC no
// commitea de forma fiable bajo Next 15.5 — ver [[nextjs-15-5-revalidatepath-hang]].
export function InsightsFamilyFilter({
  present,
  active,
}: {
  present: InsightFamily[];
  active: InsightFamily | null;
}) {
  if (present.length < 2) return null;
  const chip = (on: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-caption font-medium transition-colors",
      on ? "border-brand-border bg-brand-subtle text-brand" : "border-border text-foreground-secondary hover:bg-secondary",
    );
  const href = (family: InsightFamily | null) => (family ? `/insights?family=${family}` : "/insights");
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por tipo">
      {([null, ...present] as Array<InsightFamily | null>).map((family) => (
        <a
          key={family ?? "all"}
          href={href(family)}
          aria-current={active === family ? "true" : undefined}
          className={chip(active === family)}
        >
          {family ? INSIGHT_FAMILY_META[family].label : "Todas"}
        </a>
      ))}
    </div>
  );
}
