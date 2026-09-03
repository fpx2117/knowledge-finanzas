import { cn } from "@/lib/utils";

/**
 * Standard page header — visual-design-personal.md §7.3. Title + short
 * plain-language subtitle on the left; period selector / notifications /
 * primary action on the right. Keep `actions` light; do not overfill.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">{title}</h1>
        {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
