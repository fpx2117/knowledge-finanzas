"use client";

import { useActionState } from "react";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { explainInsightAction, type ExplainInsightState } from "@/features/insights/actions/insight-actions";

const initial: ExplainInsightState | null = null;

// spec 09 §20 — an optional AI restatement layered over the deterministic evidence, which is
// always shown regardless. If the call fails, the user just sees why and keeps the evidence.
export function InsightExplain({ insightId }: { insightId: string }) {
  const [state, action, pending] = useActionState(explainInsightAction, initial);

  return (
    <div className="flex flex-col gap-3">
      {state?.ok ? (
        <div className="relative flex flex-col gap-1.5 overflow-hidden rounded-xl border border-brand-border bg-brand-subtle p-4">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="flex items-center gap-2">
            <SparklesIcon aria-hidden className="size-4 text-brand" />
            <h3 className="text-small font-medium text-foreground">Explicación</h3>
            <span className="text-caption text-muted-foreground">generada con IA · basada en la evidencia de arriba</span>
          </div>
          <p className="text-small text-foreground-secondary">{state.explanation}</p>
          {state.caveats ? <p className="text-caption text-muted-foreground">{state.caveats}</p> : null}
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="insightId" value={insightId} />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <SparklesIcon className="size-3.5" /> {pending ? "Generando…" : "Explicar con IA"}
          </Button>
        </form>
      )}
      {state?.ok === false ? (
        <p role="alert" className="text-caption text-muted-foreground">
          No pudimos generar una explicación con IA ({state.error.message}). La evidencia de arriba sigue disponible.
        </p>
      ) : null}
    </div>
  );
}
