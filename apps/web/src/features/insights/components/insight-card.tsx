"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/shared/status-chip";
import { MoneyAmount } from "@/components/financial/money-amount";
import { cn } from "@/lib/utils";
import { INSIGHT_CONFIDENCE_LABEL, INSIGHT_FAMILY_META, INSIGHT_FEEDBACK_OPTIONS } from "@/features/insights/insight-meta";
import { dismissInsightAction, resolveInsightAction } from "@/features/insights/actions/insight-actions";
import type { InsightView } from "@/features/insights/services/insight-service";

export function InsightCard({ insight, showActions = true }: { insight: InsightView; showActions?: boolean }) {
  const router = useRouter();
  const meta = INSIGHT_FAMILY_META[insight.family];
  const Icon = meta.icon;
  const [dismissState, dismiss, dismissPending] = useActionState(dismissInsightAction, null);
  const [, resolve, resolvePending] = useActionState(resolveInsightAction, null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if ((dismissState?.ok || false) && !dismissPending) router.refresh();

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            insight.family === "INS-CASH-RISK" ? "bg-warning-soft text-[var(--warning)]" : "bg-brand-subtle text-brand",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-small font-medium text-foreground">{insight.title}</h3>
            <span className="text-caption text-muted-foreground">{meta.label}</span>
            <StatusChip tone={insight.confidence === "HIGH" ? "info" : "neutral"}>
              {INSIGHT_CONFIDENCE_LABEL[insight.confidence]}
            </StatusChip>
          </div>
          <p className="text-small text-foreground-secondary">{insight.body}</p>
          {insight.impactAmount && insight.impactCurrency ? (
            <p className="text-caption text-muted-foreground">
              Impacto estimado:{" "}
              <MoneyAmount amount={insight.impactAmount} currency={insight.impactCurrency} variant="compact" sign="always" tone="auto" className="font-medium" />
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {insight.cta ? (
          <Button size="sm" variant="outline" render={<Link href={insight.cta.href}>{insight.cta.label}</Link>} />
        ) : null}
        <Button size="sm" variant="ghost" render={<Link href={`/insights/${insight.id}`}>¿Por qué veo esto?<ChevronRightIcon className="size-3.5" /></Link>} />
        {showActions ? (
          <div className="ml-auto flex items-center gap-1">
            <form action={resolve}>
              <input type="hidden" name="insightId" value={insight.id} />
              <Button size="sm" variant="ghost" type="submit" disabled={resolvePending} aria-label="Marcar como resuelto">
                <CheckIcon className="size-3.5" /> Resuelto
              </Button>
            </form>
            <Button size="sm" variant="ghost" type="button" onClick={() => setFeedbackOpen((v) => !v)} aria-expanded={feedbackOpen}>
              <XIcon className="size-3.5" /> Descartar
            </Button>
          </div>
        ) : null}
      </div>

      {feedbackOpen ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <span className="text-caption text-muted-foreground">¿Por qué lo descartás? (opcional)</span>
          {INSIGHT_FEEDBACK_OPTIONS.map((option) => (
            <form key={option.value} action={dismiss}>
              <input type="hidden" name="insightId" value={insight.id} />
              <input type="hidden" name="feedback" value={option.value} />
              <Button size="sm" variant="outline" type="submit" disabled={dismissPending}>
                {option.label}
              </Button>
            </form>
          ))}
          <form action={dismiss}>
            <input type="hidden" name="insightId" value={insight.id} />
            <Button size="sm" variant="ghost" type="submit" disabled={dismissPending}>
              Descartar sin motivo
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}
