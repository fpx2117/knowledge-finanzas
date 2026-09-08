import { SparklesIcon, WandSparklesIcon, HistoryIcon, HelpCircleIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// spec 10 §7.8 — a small, consistent badge that names *where* a prefilled value came from, so an
// inferred value never looks like something the user typed. `review` is the only one that reads
// as "act on me" (amber); the rest are calm, informational.
export type InferenceOrigin = "rule" | "history" | "text" | "review";

const META: Record<InferenceOrigin, { label: string; icon: LucideIcon; tone: string }> = {
  rule: { label: "Sugerido por tu regla", icon: WandSparklesIcon, tone: "text-brand" },
  history: { label: "Sugerido por movimientos anteriores", icon: HistoryIcon, tone: "text-brand" },
  text: { label: "Interpretado del texto", icon: SparklesIcon, tone: "text-brand" },
  review: { label: "Necesita revisión", icon: HelpCircleIcon, tone: "text-[var(--warning)]" },
};

export function InferenceBadge({ origin, className }: { origin: InferenceOrigin; className?: string }) {
  const { label, icon: Icon, tone } = META[origin];
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption font-medium", tone, className)}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
