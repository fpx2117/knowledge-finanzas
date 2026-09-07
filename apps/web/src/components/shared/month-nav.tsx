"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
 * shared `?period=YYYY-MM` param; omitting it means the current month. The "next" arrow stops at
 * the current month (no budgeting the future here).
 */
export function MonthNav({ current, min }: { current: string; min?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period")?.match(/^\d{4}-\d{2}$/) ? searchParams.get("period")! : current;

  function go(period: string) {
    const next = new URLSearchParams(searchParams);
    if (period === current) next.delete("period");
    else next.set("period", period);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const [y, m] = period.split("-").map(Number);
  const label = `${MONTHS_ES[m - 1]} ${y}`;
  const atMax = period >= current;
  const atMin = min ? period <= min : false;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <button
        type="button"
        onClick={() => go(shift(period, -1))}
        disabled={atMin}
        aria-label="Mes anterior"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <span className="min-w-[8.5rem] text-center text-small font-medium capitalize text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => go(shift(period, 1))}
        disabled={atMax}
        aria-label="Mes siguiente"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </div>
  );
}
