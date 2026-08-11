import { Money } from "../money/money";
import { parseLocalDate } from "../dates/local-date";
import { InstallmentEngineError } from "./installment-errors";
import type { InstallmentPreviewItem } from "./generate-installments";

export function validateInstallmentPreview(input: { totalPayable: Money; installments: readonly InstallmentPreviewItem[] }) {
  if (input.installments.length === 0) throw new InstallmentEngineError("EMPTY_INSTALLMENTS", { field: "installments" });
  let total = Money.zero(input.totalPayable.currency);
  let previousDate: string | undefined;
  input.installments.forEach((installment, index) => {
    if (installment.installmentNumber !== index + 1) throw new InstallmentEngineError("NON_SEQUENTIAL_INSTALLMENT_NUMBERS", { installmentNumber: installment.installmentNumber });
    try { parseLocalDate(installment.dueDate); } catch { throw new InstallmentEngineError("INVALID_FIRST_DUE_DATE", { field: `installments[${index}].dueDate`, installmentNumber: installment.installmentNumber }); }
    if (previousDate && installment.dueDate <= previousDate) throw new InstallmentEngineError(installment.dueDate === previousDate ? "DUPLICATE_DUE_DATE" : "DATES_NOT_STRICTLY_ASCENDING", { installmentNumber: installment.installmentNumber });
    previousDate = installment.dueDate;
    if (installment.totalAmount.currency !== input.totalPayable.currency || installment.totalAmount.amount.lte(0)) throw new InstallmentEngineError(installment.totalAmount.currency !== input.totalPayable.currency ? "CURRENCY_MISMATCH" : "INVALID_INSTALLMENT_AMOUNT", { installmentNumber: installment.installmentNumber });
    total = total.add(installment.totalAmount);
  });
  if (!total.equals(input.totalPayable)) throw new InstallmentEngineError("INSTALLMENT_TOTAL_MISMATCH", { field: "totalPayable" });
  return { installments: input.installments.map((item) => ({ ...item })), totalPayable: input.totalPayable };
}
