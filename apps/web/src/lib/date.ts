// AGENTS.md §35: financial "today"/date-boundary concepts must use the user's timezone, never
// the server's. UTC-based extraction (`date.toISOString().slice(0, 10)`) silently shifts the
// calendar day near timezone boundaries — this module is the single place that formats a date
// as YYYY-MM-DD for a given IANA timezone, so no form has to reimplement it (and get it wrong).

/**
 * Formats a Date as YYYY-MM-DD in the given IANA timezone (defaults to the
 * browser's local timezone). Safe for HTML `<input type="date">` values.
 */
export function formatDateInTimezone(date: Date, timeZone?: string): string {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Today's date as YYYY-MM-DD in the given IANA timezone (defaults to the
 * browser's local timezone). Use this instead of `new Date().toISOString().slice(0, 10)`
 * for any "today" default in a financial form.
 */
export function getTodayInTimezone(timeZone?: string): string {
  return formatDateInTimezone(new Date(), timeZone);
}

/**
 * Turns a `<input type="date">` value (YYYY-MM-DD, in the user's timezone) into an
 * instant to persist as `occurredAt`. If the user picked today, the movement happened
 * "now" — fabricating a fixed noon-UTC timestamp would read as future-dated for anyone
 * whose wall clock is still before that instant, and the service rejects future dates.
 * Past dates keep a stable mid-day timestamp so the calendar day never shifts.
 */
export function resolveOccurredAtISO(date: string, timeZone?: string): string {
  if (date === getTodayInTimezone(timeZone)) return new Date().toISOString();
  return `${date}T12:00:00Z`;
}
