import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KnowFinanzas.html `.info-bar` — a soft brand-tinted strip that explains, without
 * alarm, how a screen's numbers behave (currency scope, manual tracking, etc.).
 */
export function InfoBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-[13px] bg-brand-subtle px-4 py-3.5 text-small leading-relaxed text-foreground-secondary",
        className,
      )}
    >
      <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
      <span>{children}</span>
    </p>
  );
}
