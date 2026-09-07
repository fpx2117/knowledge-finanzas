import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Standard page header (visual-design-personal.md §7.3 / spec 13 §9.4): an optional breadcrumb,
 * then the title + short plain-language subtitle on the left, page-level actions on the right.
 * Global actions (search, notifications) live in the app header, never here (§9.3).
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Spec 13 §10 — `Módulo / Subvista / Entidad`. Ancestors link; the last segment is the
   * current page and is never a link. Omit on root pages whose title already orients (§10.2). */
  breadcrumb?: Crumb[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {breadcrumb && breadcrumb.length > 0 ? <Breadcrumb items={breadcrumb} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">{title}</h1>
          {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-small text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground/60" /> : null}
              {item.href && !last ? (
                <Link href={item.href} className="rounded transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className={cn("truncate", last && "max-w-[16rem] font-medium text-foreground")} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
