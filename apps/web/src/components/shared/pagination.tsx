import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Server-rendered page nav for any list. Ninguna tabla del sistema debe crecer sin límite —
 * las páginas cortan sus filas a `PAGE_SIZE` y renderizan esto. `hrefFor` arma la URL de cada
 * página preservando los demás filtros; el contenido cambia por página, así que `<Link>` navega
 * de forma fiable (a diferencia de un cambio query-only que no mueve el RSC).
 */
export const PAGE_SIZE = 25;

export function Pagination({
  page,
  totalPages,
  hrefFor,
  className,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const box = "inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-small font-medium text-foreground transition-colors hover:bg-secondary";
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label="Paginación" className={cn("flex items-center justify-between gap-3 pt-2", className)}>
      <span className="text-caption text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={box}>
            <ChevronLeftIcon className="size-4" /> Anterior
          </Link>
        ) : (
          <span aria-hidden className={cn(box, disabled)}>
            <ChevronLeftIcon className="size-4" /> Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} rel="next" className={box}>
            Siguiente <ChevronRightIcon className="size-4" />
          </Link>
        ) : (
          <span aria-hidden className={cn(box, disabled)}>
            Siguiente <ChevronRightIcon className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

/** Slice a full list for the current page + report the page count. */
export function paginate<T>(all: readonly T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    page: current,
    totalPages,
    rows: all.slice((current - 1) * pageSize, current * pageSize),
  };
}
