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

export type KaiDateRangeKind = "month" | "day" | "week" | "quarter" | "year" | "range";

export type KaiDateRange = {
  from: Date;
  to: Date;
  /** es-AR label for templates ("este mes", "ayer", "el último trimestre"). */
  label: string;
  kind: KaiDateRangeKind;
};

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function ymd(local: string): [number, number, number] {
  const [y, m, d] = local.split("-").map(Number);
  return [y, m, d];
}
function dayStart(y: number, m: number, d: number, timezone: string): Date {
  return dayRangeForTimezone(todayInTimezone(new Date(Date.UTC(y, m - 1, d, 12)), timezone), timezone).start;
}

/**
 * Resolves the temporal expression in a message to a concrete range (spec §3 LEVEL 2,
 * §15). Defaults to the current month — the most common framing ("¿cuánto gasté?").
 * Recognises: hoy, ayer, esta/última semana, quincena, este/último mes, este/último
 * trimestre, este/último año, últimos N días/semanas/meses, "en {mes}".
 */
export function resolveDateRange(normalized: string, now: Date, timezone: string): KaiDateRange {
  const today = todayInTimezone(now, timezone);
  const [y, m, d] = ymd(today);

  if (/\bayer\b/.test(normalized)) {
    const yesterday = todayInTimezone(new Date(Date.UTC(y, m - 1, d - 1, 12)), timezone);
    const range = dayRangeForTimezone(yesterday, timezone);
    return { from: range.start, to: range.end, label: "ayer", kind: "day" };
  }
  if (/\bhoy\b/.test(normalized)) {
    const range = dayRangeForTimezone(today, timezone);
    return { from: range.start, to: range.end, label: "hoy", kind: "day" };
  }

  // "últimos N días / semanas / meses"
  const lastN = /ultim[oa]s?\s+(\d{1,2})\s+(dias?|semanas?|meses)/.exec(normalized);
  if (lastN) {
    const n = Math.min(36, Number(lastN[1]));
    const unit = lastN[2];
    const end = dayRangeForTimezone(today, timezone).end;
    if (unit.startsWith("dia")) {
      return { from: dayStart(y, m, d - (n - 1), timezone), to: end, label: `los últimos ${n} días`, kind: "range" };
    }
    if (unit.startsWith("semana")) {
      return { from: dayStart(y, m, d - (n * 7 - 1), timezone), to: end, label: `las últimas ${n} semanas`, kind: "range" };
    }
    const start = monthRangeForTimezone(m - (n - 1) <= 0 ? y - 1 : y, ((m - (n - 1) - 1 + 12) % 12) + 1, timezone).start;
    return { from: start, to: end, label: `los últimos ${n} meses`, kind: "range" };
  }

  if (/\b(esta quincena|ultimos 15 dias|ultima quincena)\b/.test(normalized)) {
    return {
      from: dayStart(y, m, d - 14, timezone),
      to: dayRangeForTimezone(today, timezone).end,
      label: "esta quincena",
      kind: "week",
    };
  }
  if (/\b(esta semana|ultimos 7 dias|ultima semana|semana)\b/.test(normalized)) {
    return {
      from: dayStart(y, m, d - 6, timezone),
      to: dayRangeForTimezone(today, timezone).end,
      label: "esta semana",
      kind: "week",
    };
  }

  if (/\b(mes pasado|ultimo mes|mes anterior)\b/.test(normalized)) {
    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;
    const range = monthRangeForTimezone(py, pm, timezone);
    return { from: range.start, to: range.end, label: "el mes pasado", kind: "month" };
  }

  // "en {mes}" — current or previous year (whichever is in the past / present)
  const monthMatch = /\ben (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/.exec(normalized);
  if (monthMatch) {
    const idx = MONTH_NAMES.indexOf(monthMatch[1]);
    const yr = idx + 1 > m ? y - 1 : y;
    const range = monthRangeForTimezone(yr, idx + 1, timezone);
    return { from: range.start, to: range.end, label: `${monthMatch[1]}${yr !== y ? ` de ${yr}` : ""}`, kind: "month" };
  }

  if (/\b(trimestre pasado|ultimo trimestre)\b/.test(normalized)) {
    const q = Math.floor((m - 1) / 3); // 0..3, current
    const prevQ = q === 0 ? 3 : q - 1;
    const qy = q === 0 ? y - 1 : y;
    const start = monthRangeForTimezone(qy, prevQ * 3 + 1, timezone).start;
    const end = monthRangeForTimezone(qy, prevQ * 3 + 3, timezone).end;
    return { from: start, to: end, label: "el trimestre pasado", kind: "quarter" };
  }
  if (/\b(este trimestre|trimestre)\b/.test(normalized)) {
    const q = Math.floor((m - 1) / 3);
    const start = monthRangeForTimezone(y, q * 3 + 1, timezone).start;
    const end = dayRangeForTimezone(today, timezone).end;
    return { from: start, to: end, label: "este trimestre", kind: "quarter" };
  }

  if (/\b(ano pasado|ultimo ano|el ano pasado)\b/.test(normalized)) {
    const start = monthRangeForTimezone(y - 1, 1, timezone).start;
    const end = monthRangeForTimezone(y - 1, 12, timezone).end;
    return { from: start, to: end, label: "el año pasado", kind: "year" };
  }
  if (/\b(este ano|en el ano|del ano)\b/.test(normalized)) {
    const start = monthRangeForTimezone(y, 1, timezone).start;
    const end = dayRangeForTimezone(today, timezone).end;
    return { from: start, to: end, label: "este año", kind: "year" };
  }

  const range = monthRangeForTimezone(y, m, timezone);
  return { from: range.start, to: range.end, label: "este mes", kind: "month" };
}

/** The calendar month immediately before the one `range` sits in — for month-over-month deltas. */
export function previousMonthRange(range: KaiDateRange, now: Date, timezone: string): { from: Date; to: Date } {
  const today = todayInTimezone(now, timezone);
  const [y, m] = ymd(today);
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const prev = monthRangeForTimezone(prevYear, prevMonth, timezone);
  return { from: prev.start, to: prev.end };
}

/**
 * The equivalent range one period earlier — for "¿gasté más que antes?". A month range → the
 * previous calendar month; a week → the previous 7 days; a day → the day before; year →
 * previous year; quarter → previous quarter. Ranges shift back by their own length.
 */
export function shiftRangeBack(range: KaiDateRange): { from: Date; to: Date; label: string } {
  const spanMs = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime());
  const from = new Date(range.from.getTime() - spanMs);
  const label =
    range.kind === "month"
      ? "el mes anterior"
      : range.kind === "week"
        ? "la semana anterior"
        : range.kind === "day"
          ? "el día anterior"
          : range.kind === "year"
            ? "el año anterior"
            : range.kind === "quarter"
              ? "el trimestre anterior"
              : "el período anterior";
  return { from, to, label };
}
