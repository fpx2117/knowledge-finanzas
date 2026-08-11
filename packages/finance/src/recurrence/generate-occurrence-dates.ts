import { formatLocalDate, parseLocalDate } from "../dates/local-date";
import type { RecurrenceFrequency } from "./recurrence-types";

function daysInMonth(year: number, month: number) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }
export function generateOccurrenceDates(input: { frequency: RecurrenceFrequency; startDate: string; endDate?: string; occurrenceCount?: number; anchorDay?: number; from: string; through: string }) {
  const start = parseLocalDate(input.startDate); parseLocalDate(input.from); parseLocalDate(input.through); if (input.endDate) parseLocalDate(input.endDate);
  const [year, month, day] = start.split("-").map(Number); const anchorDay = input.anchorDay ?? day; const dates: string[] = [];
  for (let index = 0; index < 10000; index += 1) {
    if (input.occurrenceCount && index >= input.occurrenceCount) break;
    let date: string;
    if (input.frequency === "WEEKLY" || input.frequency === "BIWEEKLY") { const value = new Date(Date.UTC(year, month - 1, day + index * (input.frequency === "WEEKLY" ? 7 : 14))); date = formatLocalDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()); }
    else { const months = index * (input.frequency === "QUARTERLY" ? 3 : input.frequency === "YEARLY" ? 12 : 1); const target = month - 1 + months; const targetYear = year + Math.floor(target / 12); const targetMonth = (target % 12) + 1; date = formatLocalDate(targetYear, targetMonth, Math.min(anchorDay, daysInMonth(targetYear, targetMonth))); }
    if (input.endDate && date > input.endDate) break;
    if (date >= input.from && date <= input.through) dates.push(date);
    if (date > input.through) break;
  }
  return dates;
}
