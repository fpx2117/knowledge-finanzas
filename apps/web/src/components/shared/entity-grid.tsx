import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * KnowFinanzas.html `.entity-grid` — the 3-up card grid used by Cuentas, Presupuestos
 * and Metas. On its own so the three screens can never drift.
 */
export function EntityGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>
  );
}

/** `.entity-card` — a `.card` with a top row (icon + tag/action), name, meta, a large amount
 *  and a bordered footer pinned to the bottom. Slots mirror the reference structure. */
export function EntityCard({
  icon,
  logo,
  tag,
  topAction,
  name,
  meta,
  amount,
  footer,
  children,
  className,
}: {
  icon: React.ReactNode;
  /** A self-contained brand mark (InstitutionLogo / MerchantLogo) shown instead of the tinted icon tile. */
  logo?: React.ReactNode;
  tag?: React.ReactNode;
  topAction?: React.ReactNode;
  name: React.ReactNode;
  meta?: React.ReactNode;
  amount?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]", className)}>
      <div className="mb-6 flex items-center justify-between gap-2.5">
        {logo ? (
          <span className="[&>*]:size-[42px] [&>*]:rounded-[13px]">{logo}</span>
        ) : (
          <span aria-hidden className="grid size-[42px] shrink-0 place-items-center rounded-[13px] bg-brand-subtle text-brand [&_svg]:size-[17px]">
            {icon}
          </span>
        )}
        {topAction ?? (tag ? <EntityTag>{tag}</EntityTag> : null)}
      </div>
      <h2 className="text-h3 break-words text-foreground">{name}</h2>
      {meta ? <p className="mt-1.5 text-caption text-muted-foreground">{meta}</p> : null}
      {amount ? (
        <p className="mt-4 break-words text-[28px] font-bold leading-tight tracking-[-0.035em] tabular-nums text-foreground">{amount}</p>
      ) : null}
      {children}
      {footer ? (
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-caption text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function EntityTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-border px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

/** `.add-entity-card` — the dashed "add another" tile that closes the grid. */
export function AddEntityCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-transparent text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-subtle/50"
    >
      <span className="grid size-10 place-items-center rounded-[13px] border border-border bg-card">
        <PlusIcon className="size-[18px]" />
      </span>
      <strong className="text-small font-medium text-foreground-secondary">{label}</strong>
    </Link>
  );
}
