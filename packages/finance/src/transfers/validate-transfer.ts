import { Money } from "../money/money";
import type { CurrencyCode } from "../money/currency";
import type { LocalDate } from "../dates/local-date";

export type TransferAccountSnapshot = {
  id: string;
  userId: string;
  currencyCode: string;
  status: "ACTIVE" | "ARCHIVED";
  openingDate: LocalDate | string;
};

export type TransferLeg = {
  accountId: string;
  type: "TRANSFER_IN" | "TRANSFER_OUT";
  amount: Money;
  currencyCode: CurrencyCode;
  source: "TRANSFER";
};

export type TransferValidationError = {
  code:
    | "TRANSFER_ACCOUNT_NOT_FOUND"
    | "TRANSFER_ACCOUNT_ARCHIVED"
    | "TRANSFER_SAME_ACCOUNT"
    | "TRANSFER_CURRENCY_MISMATCH"
    | "TRANSFER_AMOUNT_INVALID"
    | "TRANSFER_DATE_INVALID"
    | "TRANSFER_BEFORE_ACCOUNT_OPENING";
  field?: "fromAccountId" | "toAccountId" | "amount" | "currencyCode" | "occurredAt";
};

export function validateTransfer(input: {
  userId: string;
  fromAccount?: TransferAccountSnapshot;
  toAccount?: TransferAccountSnapshot;
  amount: string;
  currencyCode: string;
  occurredAt: Date;
  occurredLocalDate: string;
  now: Date;
}): { ok: true; legs: readonly [TransferLeg, TransferLeg]; amount: Money } | { ok: false; errors: TransferValidationError[] } {
  const errors: TransferValidationError[] = [];
  if (!input.fromAccount) errors.push({ code: "TRANSFER_ACCOUNT_NOT_FOUND", field: "fromAccountId" });
  if (!input.toAccount) errors.push({ code: "TRANSFER_ACCOUNT_NOT_FOUND", field: "toAccountId" });
  if (input.fromAccount && input.toAccount && input.fromAccount.id === input.toAccount.id) errors.push({ code: "TRANSFER_SAME_ACCOUNT" });
  if (input.fromAccount && input.toAccount && (input.fromAccount.userId !== input.userId || input.toAccount.userId !== input.userId)) errors.push({ code: "TRANSFER_ACCOUNT_NOT_FOUND" });
  if (input.fromAccount?.status === "ARCHIVED" || input.toAccount?.status === "ARCHIVED") errors.push({ code: "TRANSFER_ACCOUNT_ARCHIVED" });
  if (input.fromAccount && input.toAccount && (input.fromAccount.currencyCode !== input.toAccount.currencyCode || input.currencyCode !== input.fromAccount.currencyCode)) errors.push({ code: "TRANSFER_CURRENCY_MISMATCH", field: "currencyCode" });
  let amount: Money | undefined;
  try { amount = Money.fromPositiveString(input.amount, input.currencyCode); } catch { errors.push({ code: "TRANSFER_AMOUNT_INVALID", field: "amount" }); }
  if (Number.isNaN(input.occurredAt.getTime()) || Number.isNaN(input.now.getTime()) || input.occurredAt > input.now) errors.push({ code: "TRANSFER_DATE_INVALID", field: "occurredAt" });
  if (input.fromAccount && input.toAccount && (input.occurredLocalDate < String(input.fromAccount.openingDate) || input.occurredLocalDate < String(input.toAccount.openingDate))) errors.push({ code: "TRANSFER_BEFORE_ACCOUNT_OPENING", field: "occurredAt" });
  if (errors.length || !amount || !input.fromAccount || !input.toAccount) return { ok: false, errors };
  return { ok: true, amount, legs: [
    { accountId: input.fromAccount.id, type: "TRANSFER_OUT", amount, currencyCode: amount.currency, source: "TRANSFER" },
    { accountId: input.toAccount.id, type: "TRANSFER_IN", amount, currencyCode: amount.currency, source: "TRANSFER" },
  ] };
}

export function calculateTransferAssetDelta(input: { outgoing: TransferLeg; incoming: TransferLeg }) {
  const valid = input.outgoing.type === "TRANSFER_OUT" && input.incoming.type === "TRANSFER_IN" && input.outgoing.accountId !== input.incoming.accountId && input.outgoing.currencyCode === input.incoming.currencyCode && input.outgoing.amount.equals(input.incoming.amount);
  return valid ? { ok: true as const, consolidatedDelta: Money.zero(input.outgoing.currencyCode) } : { ok: false as const, error: "INVALID_TRANSFER_LEGS" as const };
}
