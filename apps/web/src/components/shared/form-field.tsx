import { cn } from "@/lib/utils";

// Shared control styling for native inputs/selects used inside server-action
// forms (where shadcn's controlled Select is awkward). Token-based, matches the
// shadcn Input look — visual-design-personal.md §10.
export const fieldControlClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-body text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  error,
  help,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-small font-medium text-foreground">
        {label}
      </label>
      {children}
      {help && !error ? <p className="text-caption text-muted-foreground">{help}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-caption text-[var(--negative)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
