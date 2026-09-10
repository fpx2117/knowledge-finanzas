import { dayRangeForTimezone, monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

/**
 * Text normalisation for the intent resolver (spec §15 "Normalizar: mayúsculas, tildes,
 * signos, fechas, expresiones temporales"). Lower-cases, strips accents and punctuation
 * and collapses whitespace so alias/keyword matching is stable.
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:()"'`*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type KaiDateRange = {
  from: Date;
  to: Date;
  /** es-AR label for templates ("este mes", "ayer", "esta semana"). */
  label: string;
  kind: "month" | "day" | "week";
};

/**
 * Resolves the temporal expression in a message to a concrete range. Defaults to the
 * current month — the most common framing for KAI questions ("¿cuánto gasté?").
 */
export function resolveDateRange(normalized: string, now: Date, timezone: string): KaiDateRange {
  const today = todayInTimezone(now, timezone);

  if (/\bayer\b/.test(normalized)) {
    const [y, m, d] = today.split("-").map(Number);
    const yesterday = todayInTimezone(new Date(Date.UTC(y, m - 1, d - 1, 12)), timezone);
    const range = dayRangeForTimezone(yesterday, timezone);
    return { from: range.start, to: range.end, label: "ayer", kind: "day" };
  }

  if (/\bhoy\b/.test(normalized)) {
    const range = dayRangeForTimezone(today, timezone);
    return { from: range.start, to: range.end, label: "hoy", kind: "day" };
  }

  if (/\b(esta semana|ultimos 7 dias|ultima semana|semana)\b/.test(normalized)) {
    const [y, m, d] = today.split("-").map(Number);
    const start = dayRangeForTimezone(
      todayInTimezone(new Date(Date.UTC(y, m - 1, d - 6, 12)), timezone),
      timezone,
    ).start;
    const end = dayRangeForTimezone(today, timezone).end;
    return { from: start, to: end, label: "esta semana", kind: "week" };
  }

  if (/\b(mes pasado|ultimo mes|mes anterior)\b/.test(normalized)) {
    const [y, m] = today.split("-").map(Number);
    const prevYear = m === 1 ? y - 1 : y;
    const prevMonth = m === 1 ? 12 : m - 1;
    const range = monthRangeForTimezone(prevYear, prevMonth, timezone);
    return { from: range.start, to: range.end, label: "el mes pasado", kind: "month" };
  }

  const [y, m] = today.split("-").map(Number);
  const range = monthRangeForTimezone(y, m, timezone);
  return { from: range.start, to: range.end, label: "este mes", kind: "month" };
}

/** The calendar month immediately before the one `range` sits in — for month-over-month deltas. */
export function previousMonthRange(range: KaiDateRange, now: Date, timezone: string): { from: Date; to: Date } {
  const today = todayInTimezone(now, timezone);
  const [y, m] = today.split("-").map(Number);
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const prev = monthRangeForTimezone(prevYear, prevMonth, timezone);
  return { from: prev.start, to: prev.end };
}
