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
      {/* Reference mobile: the title and the period control share the top line; the subtitle sits
          full-width underneath (never inflating the title column so the control can't wrap away). */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-4">
          <h1 className="text-[1.7rem] font-black leading-[1.15] tracking-[-0.03em] text-foreground sm:text-h1">{title}</h1>
          {actions ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">{actions}</div> : null}
        </div>
        {description ? <p className="text-small text-muted-foreground sm:text-body">{description}</p> : null}
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
