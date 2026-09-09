import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { InsightsTabs } from "@/features/insights/components/insights-tabs";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusChip, type ChipTone } from "@/components/shared/status-chip";
import { Pagination, paginate } from "@/components/shared/pagination";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { formatLongDate } from "@/lib/format";
import { createInsightService } from "@/features/insights/services/insight-service";
import { INSIGHT_FAMILY_META } from "@/features/insights/insight-meta";

const service = createInsightService();

const STATUS_META: Record<string, { label: string; tone: ChipTone }> = {
  SEEN: { label: "Vista", tone: "neutral" },
  DISMISSED: { label: "Descartada", tone: "neutral" },
  RESOLVED: { label: "Resuelta", tone: "positive" },
  EXPIRED: { label: "Expirada", tone: "neutral" },
  SUPERSEDED: { label: "Reemplazada", tone: "neutral" },
  INVALIDATED: { label: "Invalidada", tone: "warning" },
};

// spec 09 §13 — auditar qué insights se generaron, qué evidencia tenían y cómo se resolvieron.
export default async function InsightHistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireCurrentUser();
  const history = await service.getHistory(user);
  const { page, totalPages, rows } = paginate(history, Number((await searchParams).page) || 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Insights" description="Todo lo que detectamos, con su evidencia y cómo se resolvió." />

      <InsightsTabs active="historial" />

      <SectionCard title="Historial" eyebrow={`${history.length}`} contentClassName="gap-0">
        {history.length === 0 ? (
          <EmptyState title="Sin historial todavía" description="Cuando descartes o resuelvas un insight, va a quedar registrado acá." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((insight) => {
              const meta = INSIGHT_FAMILY_META[insight.family];
              const statusMeta = STATUS_META[insight.status] ?? { label: insight.status, tone: "neutral" as ChipTone };
              return (
                <li key={insight.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Link href={`/insights/${insight.id}`} className="truncate text-small font-medium text-foreground hover:text-brand hover:underline">
                      {insight.title}
                    </Link>
                    <span className="text-caption text-muted-foreground">
                      {meta.label} · detectada el {formatLongDate(insight.detectedAt)}
                    </span>
                  </span>
                  <StatusChip tone={statusMeta.tone}>{statusMeta.label}</StatusChip>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} totalPages={totalPages} hrefFor={(p) => (p > 1 ? `/insights/history?page=${p}` : "/insights/history")} />
      </SectionCard>
    </div>
  );
}
