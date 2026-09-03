"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { generateInstallments, InstallmentEngineError, Money, parseLocalDate } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createDebtService } from "../services/debt-service";
import { createDebtPaymentService } from "../services/debt-payment-service";
import { cancelDebtSchema, createDebtSchema, recordPaymentSchema } from "../schemas/debt-schemas";

const debtService = createDebtService();
const paymentService = createDebtPaymentService();

export type DebtActionState = { ok: true } | { ok: false; error: ReturnType<typeof mapErrorToUi> };

/** First due date = one frequency-step after the start date, keeping the day of month. */
function firstDueDate(startDate: string, frequency: "MONTHLY" | "WEEKLY" | "BIWEEKLY"): string {
  const [y, m, d] = startDate.split("-").map(Number);
  if (frequency === "MONTHLY") {
    const targetMonth = m; // next month (m is 1-based, so index m == next month)
    const year = y + Math.floor(targetMonth / 12);
    const month = (targetMonth % 12) + 1;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, daysInMonth)).padStart(2, "0")}`;
  }
  const step = frequency === "WEEKLY" ? 7 : 14;
  const date = new Date(Date.UTC(y, m - 1, d + step));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export async function createDebtAction(
  _previousState: DebtActionState | null,
  formData: FormData,
): Promise<DebtActionState> {
  try {
    const user = await requireCurrentUser();
    const input = createDebtSchema.parse({
      name: formData.get("name"),
      creditor: formData.get("creditor") || undefined,
      type: formData.get("type"),
      currencyCode: formData.get("currencyCode"),
      originalAmount: formData.get("originalAmount"),
      startDate: formData.get("startDate"),
      installmentCount: formData.get("installmentCount"),
      frequency: formData.get("frequency"),
      notes: formData.get("notes") || undefined,
    });

    parseLocalDate(input.startDate);
    let generated;
    try {
      generated = generateInstallments({
        totalPayable: Money.fromPositiveString(input.originalAmount, input.currencyCode),
        installmentCount: input.installmentCount,
        firstDueDate: firstDueDate(input.startDate, input.frequency),
        frequency: input.frequency,
      });
    } catch (error) {
      if (error instanceof InstallmentEngineError) {
        throw new ApplicationError("INVALID_INPUT", { field: error.field ?? "installmentCount", cause: error });
      }
      throw error;
    }

    await debtService.createDebt(user.id, {
      name: input.name,
      creditor: input.creditor,
      type: input.type,
      currencyCode: input.currencyCode,
      originalAmount: input.originalAmount,
      startDate: input.startDate,
      interestType: "NO_INTEREST",
      notes: input.notes,
      installments: generated.installments.map((item) => ({
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        principalAmount: item.totalAmount.toString(),
        interestAmount: "0",
        feeAmount: "0",
        totalAmount: item.totalAmount.toString(),
      })),
    });

    revalidatePath("/debts");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/debts");
}

export async function recordPaymentAction(
  _previousState: DebtActionState | null,
  formData: FormData,
): Promise<DebtActionState> {
  let debtId = "";
  try {
    const user = await requireCurrentUser();
    const input = recordPaymentSchema.parse({
      debtId: formData.get("debtId"),
      accountId: formData.get("accountId"),
      amount: formData.get("amount"),
      paidAt: formData.get("paidAt") || undefined,
      notes: formData.get("notes") || undefined,
    });
    debtId = input.debtId;
    await paymentService.recordDebtPayment(user, input);
    revalidatePath("/debts");
    revalidatePath(`/debts/${debtId}`);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  return { ok: true };
}

export async function cancelDebtAction(
  _previousState: DebtActionState | null,
  formData: FormData,
): Promise<DebtActionState> {
  try {
    const user = await requireCurrentUser();
    const { debtId } = cancelDebtSchema.parse({ debtId: formData.get("debtId") });
    await debtService.cancelDebt(user.id, debtId);
    revalidatePath("/debts");
    revalidatePath("/dashboard");
  } catch (error) {
    return { ok: false, error: mapErrorToUi(error) };
  }
  redirect("/debts");
}
