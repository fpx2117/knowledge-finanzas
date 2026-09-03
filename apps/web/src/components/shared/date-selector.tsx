"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function label(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS_ES[(month ?? 1) - 1]} ${year}`;
}

/**
 * Period selector — visual-design-personal.md §10.3. Lives in the header of
 * data-heavy screens; writes `?period=YYYY-MM` so server components read one
 * consistent period. Shows the last 12 months.
 */
export function DateSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("period") ?? currentPeriod();

  const options = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, []);

  function select(period: string) {
    const next = new URLSearchParams(searchParams);
    if (period === currentPeriod()) next.delete("period");
    else next.set("period", period);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-small font-medium text-foreground transition-colors hover:bg-secondary">
        <CalendarIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        {label(active)}
        <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {options.map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => select(period)}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-small transition-colors hover:bg-secondary",
              period === active ? "font-medium text-brand" : "text-foreground",
            )}
          >
            {label(period)}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
