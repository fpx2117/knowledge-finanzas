import { cn } from "@/lib/utils";

/**
 * Empty state — visual-design-personal.md §23: short explanation, one primary
 * action, optional atmospheric visual. Used whenever a screen or panel has no
 * data yet.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-lg bg-brand-subtle text-brand [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <h3 className="text-body-lg font-medium text-foreground">{title}</h3>
      {description ? <p className="max-w-sm text-small text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
