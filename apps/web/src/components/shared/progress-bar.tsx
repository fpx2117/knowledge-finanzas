import { cn } from "@/lib/utils";

type ProgressState = "normal" | "warning" | "exceeded";

// Budget / goal progress — visual-design-personal.md §17.4 progress convention:
// under control = brand, approaching limit = warning, limit reached = negative.
const FILL: Record<ProgressState, string> = {
  normal: "bg-primary",
  warning: "bg-warning-vivid",
  exceeded: "bg-negative-vivid",
};

export function ProgressBar({
  value,
  state = "normal",
  className,
  "aria-label": ariaLabel,
}: {
  /** 0–100 (values above 100 are clamped for the bar but keep their meaning in text). */
  value: number;
  state?: ProgressState;
  className?: string;
  "aria-label"?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-300 ease-out", FILL[state])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
