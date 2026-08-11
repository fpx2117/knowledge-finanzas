import { formatLocalDate, parseLocalDate, type LocalDate } from "../dates/local-date";
import { InstallmentEngineError } from "./installment-errors";

export type InstallmentFrequency = "MONTHLY" | "WEEKLY" | "BIWEEKLY";

function daysInMonth(year: number, month: number) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); }

export function generateInstallmentDates(input: { firstDueDate: LocalDate | string; installmentCount: number; frequency: InstallmentFrequency; anchorDay?: number }) {
  const first = parseLocalDate(input.firstDueDate);
  if (!Number.isSafeInteger(input.installmentCount) || input.installmentCount <= 0) throw new InstallmentEngineError("INVALID_INSTALLMENT_COUNT", { field: "installmentCount" });
  const [year, month, day] = first.split("-").map(Number);
  const anchorDay = input.anchorDay ?? day;
  if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) throw new InstallmentEngineError("INVALID_ANCHOR_DAY", { field: "anchorDay" });
  if (input.frequency === "MONTHLY" && day !== Math.min(anchorDay, daysInMonth(year, month))) throw new InstallmentEngineError("INVALID_FIRST_DUE_DATE", { field: "firstDueDate" });
  if (!["MONTHLY", "WEEKLY", "BIWEEKLY"].includes(input.frequency)) throw new InstallmentEngineError("INVALID_FREQUENCY", { field: "frequency" });
  return Array.from({ length: input.installmentCount }, (_, index) => {
    if (input.frequency === "WEEKLY" || input.frequency === "BIWEEKLY") {
      const date = new Date(Date.UTC(year, month - 1, day + index * (input.frequency === "WEEKLY" ? 7 : 14)));
      return formatLocalDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
    const targetMonthIndex = month - 1 + index;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = (targetMonthIndex % 12) + 1;
    return formatLocalDate(targetYear, targetMonth, Math.min(anchorDay, daysInMonth(targetYear, targetMonth)));
  });
}
