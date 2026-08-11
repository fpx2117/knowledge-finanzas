import { Money } from "../money/money";
import type { DerivedInstallmentStatus } from "./installment-status";
export function deriveDebtStatus(input: { cancelled: boolean; currency: string; installments: Array<{ status: DerivedInstallmentStatus; remainingAmount: Money }> }) {
  const zero = Money.zero(input.currency);
  const remaining = input.installments.reduce((sum, item) => item.status === "CANCELLED" ? sum : sum.add(item.remainingAmount), zero);
  if (input.cancelled) return { status: "CANCELLED" as const, remainingAmount: remaining };
  if (input.installments.length > 0 && input.installments.filter((item) => item.status !== "CANCELLED").every((item) => item.remainingAmount.isZero())) return { status: "PAID" as const, remainingAmount: remaining };
  if (input.installments.some((item) => item.status === "OVERDUE")) return { status: "OVERDUE" as const, remainingAmount: remaining };
  return { status: "ACTIVE" as const, remainingAmount: remaining };
}
