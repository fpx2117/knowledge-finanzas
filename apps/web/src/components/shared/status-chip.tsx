import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "positive" | "warning" | "negative" | "info";

// Status chip — visual-design-personal.md §13. Soft fill, pill shape; colour
// reinforces meaning but never carries it alone (readable in grayscale).
const TONE: Record<ChipTone, string> = {
  neutral: "bg-secondary text-foreground-secondary",
  positive: "bg-success-soft text-[var(--success)]",
  warning: "bg-warning-soft text-[var(--warning)]",
  negative: "bg-negative-soft text-[var(--negative)]",
  info: "bg-brand-subtle text-brand",
};

export function StatusChip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
