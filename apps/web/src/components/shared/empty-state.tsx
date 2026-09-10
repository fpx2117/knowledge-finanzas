import { cn } from "@/lib/utils";

/**
 * Empty state — visual-design-personal.md §23: short explanation, one primary
 * action, optional atmospheric visual. Used whenever a screen or panel has no
 * data yet.
 *
 * `size="section"` is the KnowFinanzas.html `.section-empty` — the tall, centered
 * empty a whole screen shows when it has no data at all (bigger art + heading).
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  size = "panel",
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  size?: "panel" | "section";
  className?: string;
}) {
  const section = size === "section";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 text-center",
        section ? "min-h-[410px] justify-center py-16" : "py-12",
        className,
      )}
    >
      {icon ? (
        // Reference "empty-art": concentric rings behind a tilted paper tile.
        <span aria-hidden="true" className={cn("relative mb-1 grid place-items-center", section ? "size-[84px]" : "size-[72px]")}>
          <span className={cn("absolute rounded-full border border-border-subtle", section ? "size-[84px]" : "size-[72px]")} />
          <span className={cn("absolute rounded-full bg-brand-subtle/60", section ? "size-[68px]" : "size-[58px]")} />
          <span className="relative grid size-10 -rotate-[9deg] place-items-center rounded-[9px] border border-border bg-card text-brand shadow-[var(--shadow-sm)] [&_svg]:size-[22px]">
            {icon}
          </span>
        </span>
      ) : null}
      <h3 className={cn("text-foreground", section ? "text-h2 max-w-md" : "text-h3")}>{title}</h3>
      {description ? (
        <p className={cn("text-small text-muted-foreground", section ? "max-w-md leading-relaxed" : "max-w-sm")}>{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
