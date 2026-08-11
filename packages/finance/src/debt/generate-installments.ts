import { Money } from "../money/money";
import { generateInstallmentDates, type InstallmentFrequency } from "./installment-dates";
import { InstallmentEngineError } from "./installment-errors";

export type InstallmentPreviewItem = { readonly installmentNumber: number; readonly dueDate: string; readonly totalAmount: Money };

export function generateInstallments(input: { totalPayable: Money; installmentCount: number; firstDueDate: string; frequency: InstallmentFrequency; anchorDay?: number }) {
  if (!Number.isSafeInteger(input.installmentCount) || input.installmentCount <= 0) throw new InstallmentEngineError("INVALID_INSTALLMENT_COUNT", { field: "installmentCount" });
  const amounts = input.totalPayable.split(input.installmentCount);
  if (amounts.some((amount) => amount.amount.lte(0))) throw new InstallmentEngineError("TOTAL_TOO_SMALL_FOR_INSTALLMENT_COUNT", { field: "totalPayable" });
  const dates = generateInstallmentDates({ ...input, installmentCount: input.installmentCount });
  return { mode: "GENERATED_INSTALLMENTS" as const, frequency: input.frequency, anchorDay: input.anchorDay ?? Number(input.firstDueDate.slice(8, 10)), totalPayable: input.totalPayable, installments: amounts.map((totalAmount, index) => ({ installmentNumber: index + 1, dueDate: dates[index], totalAmount })) };
}
