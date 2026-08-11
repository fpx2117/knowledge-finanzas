import { Money } from "../money/money";
export function calculateSpendable(input: { currency: string; liquidBalance: Money; reservedAmount?: Money; horizonStart: string; horizonEnd: string; obligations: Array<{ sourceId: string; title: string; dueDate: string; remainingAmount: Money; isOverdue?: boolean }> }) {
  const reserved = input.reservedAmount ?? Money.zero(input.currency);
  if (reserved.currency !== input.currency || input.liquidBalance.currency !== input.currency) throw new Error("CURRENCY_MISMATCH");
  const commitments = input.obligations.filter((item) => item.remainingAmount.currency === input.currency && item.remainingAmount.amount.gt(0) && item.dueDate <= input.horizonEnd);
  const committed = commitments.reduce((sum, item) => sum.add(item.remainingAmount), Money.zero(input.currency));
  return { currency: input.currency, horizonStart: input.horizonStart, horizonEnd: input.horizonEnd, horizonDays: 30, liquidBalance: input.liquidBalance, reservedAmount: reserved, committedObligations: committed, spendable: input.liquidBalance.subtract(reserved).subtract(committed), commitments };
}
