import { cn } from "@/lib/utils";

export type DonutSegment = {
  label: string;
  /** Numeric weight; the chart normalizes to the total. */
  value: number;
  /** Any CSS colour — pass a token, e.g. "var(--chart-1)". */
  color: string;
  /** Optional formatted value shown in the legend (e.g. "$ 1.250.000"). */
  display?: string;
};

const RADIUS = 62;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Distribution donut — visual-design-personal.md §15.2. Center holds the total;
 * legend sits to the right on desktop. Keep categories to a manageable count and
 * group the tail into "Otros" before passing segments in.
 */
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  expanded = false,
  className,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  /** Larger donut + always-visible amounts, for the expanded modal view. */
  expanded?: boolean;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:gap-7", expanded && "gap-6 sm:gap-10", className)}>
      <div className={cn("relative shrink-0", expanded ? "size-52 sm:size-60" : "size-28 sm:size-40")}>
      <svg viewBox="0 0 160 160" className="size-full -rotate-90" role="img" aria-label={centerLabel ?? "Distribución"}>
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        {total > 0 &&
          segments.map((segment) => {
            const fraction = Math.max(0, segment.value) / total;
            const dash = fraction * CIRCUMFERENCE;
            const el = (
              <circle
                key={segment.label}
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
      </svg>
      {centerValue ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn("font-medium text-foreground tabular-nums", expanded ? "text-body-lg" : "text-small sm:text-body-lg")}>
            {centerValue}
          </span>
          {centerLabel ? <span className={cn("text-muted-foreground", expanded ? "text-caption" : "text-[10px] sm:text-caption")}>{centerLabel}</span> : null}
        </div>
      ) : null}
      </div>

      <ul className="flex w-full min-w-0 flex-col gap-2 sm:gap-2.5">
        {segments.map((segment) => {
          const pct = total > 0 ? Math.round((Math.max(0, segment.value) / total) * 100) : 0;
          return (
            <li key={segment.label} className={cn("flex items-center gap-2", expanded ? "text-small" : "text-caption sm:text-small")}>
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="min-w-0 flex-1 truncate text-foreground-secondary">{segment.label}</span>
              <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">{`${pct}%`}</span>
              {segment.display ? (
                <span className={cn("shrink-0 tabular-nums font-medium text-foreground", expanded ? "inline" : "hidden sm:inline")}>
                  {segment.display}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
