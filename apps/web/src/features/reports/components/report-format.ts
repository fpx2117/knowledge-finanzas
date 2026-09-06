// Pure formatting helpers for the Reports module. Kept in a plain module (no "use client") so
// server components — every /reports/* page — can call them directly. `report-shared.tsx` is a
// client module; calling one of its exports from a server component throws
// "Attempted to call periodLabel() from the server but periodLabel is on the client".

import { type DonutSegment } from "@/components/charts/donut-chart";
import type { CategorySlice } from "../services/report-service";

export const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--muted-foreground)",
];

const MONTHS_LONG_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

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
    segments.push({
      label: `Otros (${rest.length})`,
      value: restTotal,
      color: DONUT_COLORS[5],
      display: `${Math.round((restTotal / total) * 100)}%`,
    });
  }
  return segments;
}
