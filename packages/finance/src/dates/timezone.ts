import { formatLocalDate, parseLocalDate, type LocalDate } from "./local-date";

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string) {
  let formatter = partsFormatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormatterCache.set(timezone, formatter);
  }

  return formatter;
}

function getDateParts(date: Date, timezone: string) {
  const parts = getFormatter(timezone).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour ?? 0,
    minute: values.minute ?? 0,
    second: values.second ?? 0,
  };
}

function localMidnightInTimezone(date: LocalDate, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  let timestamp = Date.UTC(year, month - 1, day);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getDateParts(new Date(timestamp), timezone);
    const expected = Date.UTC(year, month - 1, day, 0, 0, 0);
    const observed = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    timestamp += expected - observed;
  }

  return new Date(timestamp);
}

export function todayInTimezone(now: Date, timezone: string): LocalDate {
  const parts = getDateParts(now, timezone);
  return formatLocalDate(parts.year, parts.month, parts.day);
}

export function dayRangeForTimezone(date: LocalDate | string, timezone: string) {
  const localDate = parseLocalDate(date);
  const start = localMidnightInTimezone(localDate, timezone);
  const nextDay = new Date(start.getTime() + 36 * 60 * 60 * 1000);
  const nextDate = todayInTimezone(nextDay, timezone);

  return {
    start,
    end: localMidnightInTimezone(nextDate, timezone),
  };
}

export function monthRangeForTimezone(year: number, month: number, timezone: string) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Month must be an integer between 1 and 12");
  }

  const startDate = formatLocalDate(year, month, 1);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endDate = formatLocalDate(nextYear, nextMonth, 1);

  return {
    start: localMidnightInTimezone(startDate, timezone),
    end: localMidnightInTimezone(endDate, timezone),
  };
}
