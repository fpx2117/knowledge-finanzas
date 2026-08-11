import Decimal from "decimal.js";
import { getCurrencyMetadata, type CurrencyCode } from "./currency";
import { roundAmount, splitAmount } from "./rounding";

const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function parseDecimal(value: string) {
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value.trim())) {
    throw new Error("Amount must be a decimal string");
  }

  return new Decimal(value.trim());
}

export class Money {
  readonly amount: Decimal;
  readonly currency: CurrencyCode;

  private constructor(amount: Decimal, currency: CurrencyCode) {
    this.currency = currency;
    this.amount = roundAmount(amount, currency);
  }

  static fromString(value: string, currency: string) {
    const metadata = getCurrencyMetadata(currency);
    return new Money(parseDecimal(value), metadata.code as CurrencyCode);
  }

  static fromPositiveString(value: string, currency: string) {
    const money = Money.fromString(value, currency);
    if (money.amount.lte(0)) {
      throw new Error("Amount must be greater than zero");
    }

    return money;
  }

  static zero(currency: string) {
    return new Money(new Decimal(0), getCurrencyMetadata(currency).code as CurrencyCode);
  }

  add(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.amount.plus(other.amount), this.currency);
  }

  subtract(other: Money) {
    this.assertSameCurrency(other);
    return new Money(this.amount.minus(other.amount), this.currency);
  }

  compareTo(other: Money) {
    this.assertSameCurrency(other);
    return this.amount.comparedTo(other.amount);
  }

  equals(other: Money) {
    return this.currency === other.currency && this.amount.equals(other.amount);
  }

  isZero() {
    return this.amount.isZero();
  }

  toString() {
    return this.amount.toFixed(getCurrencyMetadata(this.currency).decimalPlaces);
  }

  split(parts: number) {
    return splitAmount(this.amount, this.currency, parts).map(
      (part) => new Money(part, this.currency),
    );
  }

  private assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} and ${other.currency}`);
    }
  }
}
