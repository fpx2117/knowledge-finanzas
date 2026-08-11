import { Money } from "../money/money";

export function calculateAssetAccountBalance(input: {
  currency: string;
  openingBalance: string;
  incomeTotal: string;
  expenseTotal: string;
  adjustmentNet?: string;
  refundTotal?: string;
  adjustmentInTotal?: string;
  adjustmentOutTotal?: string;
  transferInTotal?: string;
  transferOutTotal?: string;
  liabilityPaymentTotal?: string;
}) {
  return Money.fromString(input.openingBalance, input.currency)
    .add(Money.fromString(input.incomeTotal, input.currency))
    .subtract(Money.fromString(input.expenseTotal, input.currency))
    .add(Money.fromString(input.refundTotal ?? "0", input.currency))
    .add(Money.fromString(input.adjustmentInTotal ?? input.adjustmentNet ?? "0", input.currency))
    .subtract(Money.fromString(input.adjustmentOutTotal ?? "0", input.currency))
    .add(Money.fromString(input.transferInTotal ?? "0", input.currency))
    .subtract(Money.fromString(input.transferOutTotal ?? "0", input.currency))
    .subtract(Money.fromString(input.liabilityPaymentTotal ?? "0", input.currency));
}
