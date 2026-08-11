import { Money } from "../money/money";
export type DerivedInstallmentStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
export function deriveInstallmentStatus(input: { totalAmount: Money; allocatedAmount: Money; dueDate: string; cancelled: boolean; today: string }) {
  if (input.totalAmount.currency !== input.allocatedAmount.currency) throw new Error("CURRENCY_MISMATCH");
  const paid = input.allocatedAmount;
  const remaining = input.totalAmount.subtract(paid);
  if (remaining.amount.isNegative()) throw new Error("NEGATIVE_REMAINING");
  if (input.cancelled) return { status: "CANCELLED" as const, paidAmount: paid, remainingAmount: remaining };
  if (remaining.isZero()) return { status: "PAID" as const, paidAmount: paid, remainingAmount: remaining };
  if (input.dueDate < input.today) return { status: "OVERDUE" as const, paidAmount: paid, remainingAmount: remaining };
  if (!remaining.equals(input.totalAmount)) return { status: "PARTIALLY_PAID" as const, paidAmount: paid, remainingAmount: remaining };
  return { status: "PENDING" as const, paidAmount: paid, remainingAmount: remaining };
}
