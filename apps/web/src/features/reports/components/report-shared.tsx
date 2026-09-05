"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { ProgressBar } from "@/components/shared/progress-bar";
import { MoneyAmount } from "@/components/financial/money-amount";
import { type DonutSegment } from "@/components/charts/donut-chart";
import { cn } from "@/lib/utils";
import type { CategorySlice } from "../services/report-service";

export const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)", "var(--chart-4)", "var(--muted-foreground)"];

const MONTHS_LONG_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return `${MONTHS_LONG_ES[(month ?? 1) - 1]} de ${year}`;
}

export function compactTotal(slices: CategorySlice[], currency: string): string {
  const total = slices.reduce((sum, slice) => sum + Number(slice.amount), 0);
  return `${currency} ${Math.round(total).toLocaleString("es-AR")}`;
}

export function toSegments(slices: CategorySlice[]): DonutSegment[] {
  const top = slices.slice(0, 5);
  const rest = slices.slice(5);
  const total = slices.reduce((s, x) => s + Number(x.amount), 0);
  const restTotal = rest.reduce((sum, slice) => sum + Number(slice.amount), 0);
  const segments = top.map((slice, index) => ({
    label: slice.name,
    value: Number(slice.amount),
    color: DONUT_COLORS[index],
    display: `${Math.round(slice.share * 100)}%`,
  }));
  if (restTotal > 0) {
    segments.push({ label: `Otros (${rest.length})`, value: restTotal, color: DONUT_COLORS[5], display: `${Math.round((restTotal / total) * 100)}%` });
  }
  return segments;
}

// Drill-down (spec 14 §16 "debe permitir drill-down"): every category slice links to the exact
// ledger rows it was computed from — /transactions filtered by category + period — never a dead end.
export function BreakdownTable({
  slices,
  currency,
  emptyLabel,
  period,
}: {
  slices: CategorySlice[];
  currency: string;
  emptyLabel: string;
  period: string;
}) {
  if (slices.length === 0) {
    return <p className="py-6 text-center text-small text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {slices.map((slice) => (
        <li key={slice.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/transactions?period=${period}${slice.id !== "sin-categoria" ? `&category=${slice.id}` : ""}`}
              className="truncate text-small font-medium text-foreground hover:text-brand hover:underline"
            >
              {slice.name}
            </Link>
            <span className="flex shrink-0 items-baseline gap-2">
              <MoneyAmount amount={slice.amount} currency={currency} variant="compact" className="text-small font-medium" />
              <span className="w-9 text-right text-caption tabular-nums text-muted-foreground">{Math.round(slice.share * 100)}%</span>
            </span>
          </div>
          <ProgressBar value={slice.share * 100} aria-label={`${slice.name}: ${Math.round(slice.share * 100)}%`} />
        </li>
      ))}
    </ul>
  );
}

const TABS = [
  { label: "Panorama", href: "/reports" },
  { label: "Gastos", href: "/reports/expenses" },
  { label: "Ingresos", href: "/reports/income" },
  { label: "Flujo de caja", href: "/reports/cash-flow" },
  { label: "Patrimonio", href: "/reports/net-worth" },
  { label: "Categorías", href: "/reports/categories" },
];

/** Canonical report routes (spec 14 §8) — preserves `?period=` across tabs. */
export function ReportsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period");
  const withPeriod = (href: string) => (period ? `${href}?period=${period}` : href);

  return (
    <nav aria-label="Secciones de reportes" className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={withPeriod(tab.href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-small transition-colors",
              active ? "border-brand font-medium text-brand" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** A non-blocking warning when accounts in other currencies were excluded from every total. */
export function ExcludedCurrenciesNote({ currencies }: { currencies: string[] }) {
  if (currencies.length === 0) return null;
  return (
    <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-[var(--warning)]">
      Este reporte no incluye tus cuentas en {currencies.join(", ")} — las monedas no se suman entre sí. Mirá{" "}
      <Link href="/accounts" className="font-medium underline">
        Cuentas
      </Link>{" "}
      para verlas por separado.
    </p>
  );
}
