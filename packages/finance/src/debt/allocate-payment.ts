import { Money } from "../money/money";
import type { InstallmentStatus } from "./debt-types";
import { PaymentAllocationEngineError } from "./payment-allocation-errors";

export type PaymentAllocationStrategy = "MANUAL" | "OLDEST_DUE_FIRST";
export type AllocationInstallmentSnapshot = { readonly id: string; readonly installmentNumber: number; readonly dueDate: string; readonly totalAmount: Money; readonly allocatedAmount: Money; readonly status: InstallmentStatus };
export type ManualPaymentAllocationInput = { readonly installmentId: string; readonly amount: Money };
export type AllocatePaymentInput =
  | { readonly amount: Money; readonly installments: readonly AllocationInstallmentSnapshot[]; readonly strategy: "OLDEST_DUE_FIRST" }
  | { readonly amount: Money; readonly installments: readonly AllocationInstallmentSnapshot[]; readonly strategy: "MANUAL"; readonly allocations: readonly ManualPaymentAllocationInput[] };
export type PaymentAllocationPreviewItem = { readonly installmentId: string; readonly installmentNumber: number; readonly dueDate: string; readonly amount: Money; readonly remainingBefore: Money; readonly remainingAfter: Money };
export type PaymentAllocationPreview = { readonly strategy: PaymentAllocationStrategy; readonly paymentAmount: Money; readonly debtRemainingBefore: Money; readonly debtRemainingAfter: Money; readonly allocatedAmount: Money; readonly allocations: readonly PaymentAllocationPreviewItem[] };

export function calculateInstallmentRemaining(input: { totalAmount: Money; allocatedAmount: Money }) {
  if (input.totalAmount.currency !== input.allocatedAmount.currency || input.allocatedAmount.amount.isNegative() || input.allocatedAmount.compareTo(input.totalAmount) > 0) throw new PaymentAllocationEngineError("INVALID_INSTALLMENT_STATE");
  return input.totalAmount.subtract(input.allocatedAmount);
}

export function calculateDebtRemaining(installments: readonly AllocationInstallmentSnapshot[]) {
  if (installments.length === 0) throw new PaymentAllocationEngineError("EMPTY_INSTALLMENTS");
  const currency = installments[0].totalAmount.currency;
  return installments.reduce((sum, installment) => installment.status === "CANCELLED" ? sum : sum.add(calculateInstallmentRemaining(installment)), Money.zero(currency));
}

export function allocatePayment(input: AllocatePaymentInput): PaymentAllocationPreview {
  if (input.installments.length === 0) throw new PaymentAllocationEngineError("EMPTY_INSTALLMENTS");
  if (input.amount.amount.lte(0)) throw new PaymentAllocationEngineError("INVALID_PAYMENT_AMOUNT");
  for (const installment of input.installments) {
    if (installment.totalAmount.currency !== input.amount.currency || installment.allocatedAmount.currency !== input.amount.currency) throw new PaymentAllocationEngineError("PAYMENT_CURRENCY_MISMATCH", { installmentId: installment.id });
    calculateInstallmentRemaining(installment);
  }
  const debtRemainingBefore = calculateDebtRemaining(input.installments);
  if (input.amount.compareTo(debtRemainingBefore) > 0) throw new PaymentAllocationEngineError("PAYMENT_EXCEEDS_DEBT_REMAINING");
  const allocations = input.strategy === "MANUAL" ? manualAllocations(input) : fifoAllocations(input);
  const allocatedAmount = allocations.reduce((sum, item) => sum.add(item.amount), Money.zero(input.amount.currency));
  if (!allocatedAmount.equals(input.amount)) throw new PaymentAllocationEngineError("PAYMENT_ALLOCATION_MISMATCH");
  const debtRemainingAfter = debtRemainingBefore.subtract(allocatedAmount);
  return { strategy: input.strategy, paymentAmount: input.amount, debtRemainingBefore, debtRemainingAfter, allocatedAmount, allocations };
}

function fifoAllocations(input: Extract<AllocatePaymentInput, { strategy: "OLDEST_DUE_FIRST" }>) {
  let remainingPayment = input.amount;
  const result: PaymentAllocationPreviewItem[] = [];
  const eligible = [...input.installments].filter((item) => item.status !== "PAID" && item.status !== "CANCELLED").sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.installmentNumber - b.installmentNumber);
  for (const installment of eligible) {
    if (remainingPayment.isZero()) break;
    const remainingBefore = calculateInstallmentRemaining(installment);
    const amount = remainingPayment.compareTo(remainingBefore) < 0 ? remainingPayment : remainingBefore;
    if (amount.isZero()) continue;
    result.push({ installmentId: installment.id, installmentNumber: installment.installmentNumber, dueDate: installment.dueDate, amount, remainingBefore, remainingAfter: remainingBefore.subtract(amount) });
    remainingPayment = remainingPayment.subtract(amount);
  }
  return result;
}

function manualAllocations(input: Extract<AllocatePaymentInput, { strategy: "MANUAL" }>) {
  if (input.allocations.length === 0) throw new PaymentAllocationEngineError("PAYMENT_ALLOCATION_MISMATCH");
  const seen = new Set<string>();
  return input.allocations.map((allocation) => {
    if (seen.has(allocation.installmentId)) throw new PaymentAllocationEngineError("DUPLICATE_ALLOCATION", { installmentId: allocation.installmentId });
    seen.add(allocation.installmentId);
    const installment = input.installments.find((item) => item.id === allocation.installmentId);
    if (!installment) throw new PaymentAllocationEngineError("INSTALLMENT_NOT_FOUND", { installmentId: allocation.installmentId });
    if (installment.status === "PAID" || installment.status === "CANCELLED") throw new PaymentAllocationEngineError("INSTALLMENT_NOT_PAYABLE", { installmentId: installment.id });
    if (allocation.amount.currency !== input.amount.currency || allocation.amount.amount.lte(0)) throw new PaymentAllocationEngineError("INVALID_ALLOCATION_AMOUNT", { installmentId: installment.id });
    const remainingBefore = calculateInstallmentRemaining(installment);
    if (allocation.amount.compareTo(remainingBefore) > 0) throw new PaymentAllocationEngineError("PAYMENT_ALLOCATION_EXCEEDS_INSTALLMENT", { installmentId: installment.id });
    return { installmentId: installment.id, installmentNumber: installment.installmentNumber, dueDate: installment.dueDate, amount: allocation.amount, remainingBefore, remainingAfter: remainingBefore.subtract(allocation.amount) };
  });
}
