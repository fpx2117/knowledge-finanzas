import Link from "next/link";
import { LightbulbIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { HeaderActions } from "@/components/shared/header-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createInsightService } from "@/features/insights/services/insight-service";
import { InsightCard } from "@/features/insights/components/insight-card";

const service = createInsightService();

// spec 09 §11 — una cola pequeña y priorizada de observaciones con evidencia, sin score opaco
// (D-07: "no existe financial health score en V1").
export default async function InsightsPage() {
  const user = await requireCurrentUser();
  const queue = await service.getQueue(user);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Insights"
        description="Lo que merece tu atención, con la evidencia detrás."
        actions={
          <>
            <HeaderActions showPeriod={false} />
            <Button variant="ghost" render={<Link href="/insights/history">Historial</Link>} />
          </>
        }
      />

      {queue.length === 0 ? (
        <EmptyState
          icon={<LightbulbIcon />}
          title="No detectamos nada que requiera tu atención"
          description="Cuando haya un cambio de gasto, un presupuesto al límite, un riesgo de caja o una meta atrasada con evidencia suficiente, lo vas a ver acá."
        />
      ) : (
        <section aria-label="Cola de insights" className="flex flex-col gap-3">
          {queue.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}
    </div>
  );
}
