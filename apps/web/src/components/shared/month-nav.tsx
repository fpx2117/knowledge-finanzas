"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function shift(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/**
 * Inline month picker — `[‹] Septiembre 2026 [›]` (spec 04 §9.2, spec 08). Reads/writes the
 * shared `?period=YYYY-MM` param. Navigates with plain `<a>` (full load), not next/link: under
 * Next 15.5 a client navigation that only changes the query string on a segment with a
 * `loading.tsx` fetches the RSC payload but never commits it, so the month never actually
 * changes. A period switch reloads every figure on the page server-side anyway.
 * Omitting `?period=` means the current month. The "next" arrow stops at the current month.
 */
export function MonthNav({ current, min }: { current: string; min?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period")?.match(/^\d{4}-\d{2}$/) ? searchParams.get("period")! : current;

  function href(target: string): string {
    const params = new URLSearchParams(searchParams);
    if (target === current) params.delete("period");
    else params.set("period", target);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const [y, m] = period.split("-").map(Number);
  const label = `${MONTHS_ES[m - 1]} ${y}`;
  const atMax = period >= current;
  const atMin = min ? period <= min : false;

  const arrow = "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {atMin ? (
        <button type="button" disabled aria-label="Mes anterior" className={arrow}>
          <ChevronLeftIcon className="size-4" />
        </button>
      ) : (
        <a href={href(shift(period, -1))} aria-label="Mes anterior" className={arrow}>
          <ChevronLeftIcon className="size-4" />
        </a>
      )}
      <span className="min-w-[8.5rem] text-center text-small font-medium capitalize text-foreground">{label}</span>
      {atMax ? (
        <button type="button" disabled aria-label="Mes siguiente" className={arrow}>
          <ChevronRightIcon className="size-4" />
        </button>
      ) : (
        <a href={href(shift(period, 1))} aria-label="Mes siguiente" className={arrow}>
          <ChevronRightIcon className="size-4" />
        </a>
      )}
    </div>
  );
}
