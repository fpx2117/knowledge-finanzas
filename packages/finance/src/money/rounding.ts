import Decimal from "decimal.js";
import { getCurrencyMetadata, type CurrencyCode } from "./currency";

export const ROUNDING_MODE = Decimal.ROUND_HALF_UP;

export function roundAmount(amount: Decimal, currency: CurrencyCode) {
  return amount.toDecimalPlaces(
    getCurrencyMetadata(currency).decimalPlaces,
    ROUNDING_MODE,
  );
}

export function splitAmount(
  amount: Decimal,
  currency: CurrencyCode,
  parts: number,
) {
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new Error("Parts must be a positive integer");
  }

  if (amount.isNegative()) {
    throw new Error("Amount must not be negative");
  }

  const decimalPlaces = getCurrencyMetadata(currency).decimalPlaces;
  const installment = amount
    .dividedBy(parts)
    .toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN);
  const remainder = amount.minus(installment.times(parts - 1));

  return Array.from({ length: parts }, (_, index) =>
    index === parts - 1 ? remainder : installment,
  );
}
