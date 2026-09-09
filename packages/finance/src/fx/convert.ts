import Decimal from "decimal.js";

import { getCurrencyMetadata } from "../money/currency";
import { ROUNDING_MODE } from "../money/rounding";

/**
 * A single foreign-exchange quote for one ordered pair (`base` → `quote`), as published by a
 * source like dolarapi's "dólar blue". The spread is intentionally preserved:
 *
 * - `bid` (compra) — what the market pays you for one unit of `base`. Used to value holdings
 *   you already have: `amountInQuote = amountInBase × bid`.
 * - `ask` (venta) — what the market charges you for one unit of `base`. Used to see how much
 *   `base` your `quote` money buys: `amountInBase = amountInQuote ÷ ask`.
 *
 * There is no such thing as an "official" mid rate here — every conversion is explicit and
 * estimated, and the UI must always label it as such (spec 00 §285: "No sumar monedas
 * diferentes sin una conversión explícita").
 */
export type FxQuote = {
  /** ISO-4217 code of the unit being priced, e.g. "USD". */
  base: string;
  /** ISO-4217 code the price is expressed in, e.g. "ARS". */
  quote: string;
  /** compra — decimal string. */
  bid: string;
  /** venta — decimal string. */
  ask: string;
};

function assertPair(quote: FxQuote) {
  if (quote.base === quote.quote) {
    throw new Error(`FxQuote base and quote must differ (got ${quote.base})`);
  }
  const bid = new Decimal(quote.bid);
  const ask = new Decimal(quote.ask);
  if (bid.lte(0) || ask.lte(0)) {
    throw new Error("FxQuote bid/ask must be positive");
  }
}

/**
 * Converts `amount` (a decimal string in `from`) into `to`, using `quote`. `from`/`to` must be
 * exactly the two currencies named by `quote` (in either direction); a same-currency conversion
 * is returned unchanged. The result is rounded to `to`'s minor unit.
 *
 * Throws when the currencies don't line up with the quote — the caller is expected to have
 * checked the pair is convertible first.
 */
export function convertAmount(amount: string, from: string, to: string, quote: FxQuote): string {
  if (from === to) {
    return new Decimal(amount).toDecimalPlaces(getCurrencyMetadata(to).decimalPlaces, ROUNDING_MODE).toFixed(
      getCurrencyMetadata(to).decimalPlaces,
    );
  }
  assertPair(quote);

  const value = new Decimal(amount);
  let converted: Decimal;
  if (from === quote.base && to === quote.quote) {
    // base → quote: value your `base` holdings at compra.
    converted = value.times(new Decimal(quote.bid));
  } else if (from === quote.quote && to === quote.base) {
    // quote → base: how much `base` your money buys, at venta.
    converted = value.dividedBy(new Decimal(quote.ask));
  } else {
    throw new Error(
      `Cannot convert ${from}→${to} with a ${quote.base}/${quote.quote} quote`,
    );
  }

  const decimals = getCurrencyMetadata(to).decimalPlaces;
  return converted.toDecimalPlaces(decimals, ROUNDING_MODE).toFixed(decimals);
}

/** Whether `convertAmount` can move between these two currencies with this quote. */
export function isConvertiblePair(from: string, to: string, quote: FxQuote): boolean {
  if (from === to) return true;
  return (
    (from === quote.base && to === quote.quote) ||
    (from === quote.quote && to === quote.base)
  );
}
