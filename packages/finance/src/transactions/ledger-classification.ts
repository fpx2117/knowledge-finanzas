import { Money } from "../money/money";

export type LedgerTransactionType = "INCOME" | "EXPENSE" | "REFUND" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "TRANSFER_IN" | "TRANSFER_OUT";

export function classifyLedgerEffect(input: { type: LedgerTransactionType; status: "POSTED" | "VOIDED"; amount: string; currency: string }) {
  const zero = Money.zero(input.currency);
  if (input.status === "VOIDED") return { balanceDelta: zero, economicClass: "EXCLUDED" as const, consumptionDelta: zero };
  const amount = Money.fromPositiveString(input.amount, input.currency);
  if (input.type === "INCOME") return { balanceDelta: amount, economicClass: "ORDINARY_INCOME" as const, consumptionDelta: zero };
  if (input.type === "EXPENSE") return { balanceDelta: zero.subtract(amount), economicClass: "CONSUMPTION" as const, consumptionDelta: amount };
  if (input.type === "REFUND") return { balanceDelta: amount, economicClass: "REFUND" as const, consumptionDelta: zero.subtract(amount) };
  if (input.type === "ADJUSTMENT_IN") return { balanceDelta: amount, economicClass: "BALANCE_ADJUSTMENT" as const, consumptionDelta: zero };
  if (input.type === "ADJUSTMENT_OUT") return { balanceDelta: zero.subtract(amount), economicClass: "BALANCE_ADJUSTMENT" as const, consumptionDelta: zero };
  if (input.type === "TRANSFER_IN") return { balanceDelta: amount, economicClass: "INTERNAL_TRANSFER" as const, consumptionDelta: zero };
  return { balanceDelta: zero.subtract(amount), economicClass: "INTERNAL_TRANSFER" as const, consumptionDelta: zero };
}

export function calculateRemainingRefundable(originalAmount: string, postedRefunds: string[], currency: string) {
  return postedRefunds.reduce((remaining, refund) => remaining.subtract(Money.fromPositiveString(refund, currency)), Money.fromPositiveString(originalAmount, currency));
}
