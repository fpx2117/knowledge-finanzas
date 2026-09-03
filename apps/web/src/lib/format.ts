const DAY_MONTH = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" });

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // A bare YYYY-MM-DD is a calendar date — pin it to local midnight, not UTC.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "05 sept" */
export function formatShortDate(value: string | Date): string {
  const date = toDate(value);
  return date ? DAY_MONTH.format(date) : "";
}

/** "05 sept 2024" */
export function formatLongDate(value: string | Date): string {
  const date = toDate(value);
  return date ? DAY_MONTH_YEAR.format(date) : "";
}

/** Whole-day distance from `today` (YYYY-MM-DD) to `target` (YYYY-MM-DD). */
export function daysUntil(target: string, today: string): number {
  const a = toDate(today);
  const b = toDate(target);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function relativeDueLabel(target: string, today: string): string {
  const diff = daysUntil(target, today);
  if (diff < 0) return `Venció hace ${Math.abs(diff)} d`;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  return `En ${diff} días`;
}
