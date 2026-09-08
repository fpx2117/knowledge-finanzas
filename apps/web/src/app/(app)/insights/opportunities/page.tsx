import { SparklesIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createInsightService } from "@/features/insights/services/insight-service";
import { InsightCard } from "@/features/insights/components/insight-card";
import { InsightsTabs } from "@/features/insights/components/insights-tabs";

const service = createInsightService();

// spec 09 §12 "Oportunidades" — mejoras o decisiones posibles que no son urgentes. Toda
// oportunidad deriva de datos personales; nunca es una lista genérica de tips (§12.1).
export default async function InsightsOpportunitiesPage() {
  const user = await requireCurrentUser();
  const items = await service.getOpportunities(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Insights" description="Mejoras posibles que no son urgentes, siempre a partir de tus datos." />

      <InsightsTabs active="oportunidades" />

      {items.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon />}
          title="Sin oportunidades detectadas"
          description="Cuando encontremos una suscripción para revisar, una categoría con margen de recorte o una meta que podés acelerar sin comprometer obligaciones, va a aparecer acá."
        />
      ) : (
        <section aria-label="Oportunidades" className="flex flex-col gap-3">
          {items.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}
    </div>
  );
}
