import Link from "next/link";
import { LightbulbIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createInsightService } from "@/features/insights/services/insight-service";
import { InsightCard } from "@/features/insights/components/insight-card";
import { InsightsTabs } from "@/features/insights/components/insights-tabs";

const service = createInsightService();

// spec 09 §11 "Para vos" — la superficie principal: sólo insights activos, ordenados por
// prioridad, sin score opaco (D-07). §11.1 separa "lo más importante ahora" del resto.
export default async function InsightsPage() {
  const user = await requireCurrentUser();
  const { items, coverage } = await service.getParaVos(user);

  const [hero, ...rest] = items;
  // §8.1 anti-saturación — como máximo 5 P0/P1 visibles sin agrupar; el resto se cuenta.
  const MAX_REST = 5;
  const shownRest = rest.slice(0, MAX_REST);
  const hiddenCount = rest.length - shownRest.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Insights"
        description="Lo que merece tu atención, con la evidencia detrás."
        actions={<HeaderActions showPeriod={false} />}
      />

      <InsightsTabs active="para-vos" />

      {items.length === 0 ? (
        <EmptyState
          icon={<LightbulbIcon />}
          title="No detectamos nada que requiera tu atención"
          description="Cuando haya un cambio de gasto, un presupuesto al límite, un riesgo de caja o una meta atrasada con evidencia suficiente, lo vas a ver acá."
        />
      ) : (
        <>
          {/* §11.2 resumen de estado */}
          <p className="text-small text-muted-foreground">
            {items.length === 1 ? "1 observación activa" : `${items.length} observaciones activas`}, ordenadas por prioridad.
          </p>

          <section aria-label="Lo más importante ahora" className="flex flex-col gap-2">
            <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Lo más importante ahora</h2>
            <InsightCard insight={hero} />
          </section>

          {shownRest.length > 0 ? (
            <section aria-label="Otros insights" className="flex flex-col gap-2">
              <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">Otros insights</h2>
              <div className="flex flex-col gap-3">
                {shownRest.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
              {hiddenCount > 0 ? (
                <p className="text-caption text-muted-foreground">
                  {hiddenCount === 1 ? "Hay 1 observación más" : `Hay ${hiddenCount} observaciones más`}. Revisá las de arriba primero.
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {/* §11.2 estado de cobertura / calidad */}
      <p className="border-t border-border pt-4 text-caption text-muted-foreground">
        Calculado con tus movimientos confirmados.{" "}
        {coverage.uncategorizedCount > 0 ? (
          <>
            Tenés{" "}
            <Link href="/transactions/pending" className="font-medium underline">
              {coverage.uncategorizedCount} movimiento{coverage.uncategorizedCount === 1 ? "" : "s"} sin categoría
            </Link>{" "}
            que pueden afectar estas observaciones.
          </>
        ) : (
          "Todos tus movimientos del período están categorizados."
        )}
      </p>
    </div>
  );
}
