import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusChip } from "@/components/shared/status-chip";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { createInsightService } from "@/features/insights/services/insight-service";
import { InsightCard } from "@/features/insights/components/insight-card";
import { InsightExplain } from "@/features/insights/components/insight-explain";
import { INSIGHT_CONFIDENCE_LABEL, INSIGHT_FAMILY_META } from "@/features/insights/insight-meta";
import type { InsightEvidence } from "@know-finanzas/finance";

const service = createInsightService();

const METRIC_LABEL: Record<string, string> = {
  spent: "Gastado",
  limit: "Límite",
  usedPercent: "% usado",
  periodProgressPercent: "% del mes transcurrido",
  currentAmount: "Ahorrado",
  targetAmount: "Objetivo",
  requiredMonthly: "Aporte mensual necesario",
  expectedProgressRatio: "Progreso esperado (ratio)",
  shortfall: "Faltante proyectado",
  committedObligations: "Obligaciones comprometidas",
  uncategorizedCount: "Movimientos sin categoría",
};

export default async function InsightDetailPage({ params }: { params: Promise<{ insightId: string }> }) {
  const { insightId } = await params;
  const user = await requireCurrentUser();
  const insight = await service.getDetail(user, insightId);
  if (!insight) notFound();

  const meta = INSIGHT_FAMILY_META[insight.family];
  const evidence = insight.evidence as InsightEvidence;
  const isOpen = ["ACTIVE", "SEEN", "DETECTED"].includes(insight.status);

  return (
    <div className="flex flex-col gap-8">
      <Link href="/insights" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Volver a Insights
      </Link>

      <PageHeader title={insight.title} description={meta.label} />

      <InsightCard insight={insight} showActions={isOpen} />

      {/* spec 09 §9 — el paquete de evidencia. El texto es una representación de estos datos. */}
      <SectionCard title="¿Por qué veo esto?" eyebrow={`Versión de cálculo ${evidence.calculationVersion}`}>
        <dl className="flex flex-col gap-2.5 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Basado en</dt>
            <dd className="text-right font-medium text-foreground">{evidence.sourceTypes.join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Período analizado</dt>
            <dd className="font-medium text-foreground">
              {formatLongDate(evidence.period.from)} – {formatLongDate(evidence.period.to)}
            </dd>
          </div>
          {evidence.comparisonPeriod ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Comparado contra</dt>
              <dd className="font-medium text-foreground">
                {formatLongDate(evidence.comparisonPeriod.from)} – {formatLongDate(evidence.comparisonPeriod.to)}
              </dd>
            </div>
          ) : null}
          {typeof evidence.sampleSize === "number" ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tamaño de muestra</dt>
              <dd className="font-medium text-foreground">{evidence.sampleSize}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Confianza</dt>
            <dd className="font-medium text-foreground">{INSIGHT_CONFIDENCE_LABEL[insight.confidence]}</dd>
          </div>
        </dl>

        {Object.keys(evidence.metrics).length > 0 ? (
          <div className="mt-2 border-t border-border pt-3">
            <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-muted-foreground">Datos usados</p>
            <dl className="grid grid-cols-1 gap-2 text-small sm:grid-cols-2">
              {Object.entries(evidence.metrics).map(([key, value]) =>
                value === "" ? null : (
                  <div key={key} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{METRIC_LABEL[key] ?? key}</dt>
                    <dd className="font-medium tabular-nums text-foreground">{value}</dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        ) : null}

        {evidence.dataQualityFlags.length > 0 ? (
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
            Limitaciones:
            {evidence.dataQualityFlags.map((flag) => (
              <StatusChip key={flag} tone="warning">{flag}</StatusChip>
            ))}
          </p>
        ) : null}

        <div className="mt-3 border-t border-border pt-3">
          <InsightExplain insightId={insight.id} />
        </div>
      </SectionCard>
    </div>
  );
}
