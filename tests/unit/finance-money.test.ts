import { describe, expect, it } from "vitest";
import { Money, getCurrencyMetadata } from "@know-finanzas/finance";

describe("Money", () => {
  it("adds exact decimal strings without floating point drift", () => {
    const result = Money.fromString("0.10", "USD").add(
      Money.fromString("0.20", "USD"),
    );

    expect(result.toString()).toBe("0.30");
  });

  it("rejects cross-currency arithmetic", () => {
    expect(() =>
      Money.fromString("100.00", "ARS").add(Money.fromString("1.00", "USD")),
    ).toThrow("Currency mismatch");
  });

  it("subtracts and compares exact values", () => {
    const balance = Money.fromString("10.00", "USD");
    const expense = Money.fromString("3.25", "USD");

    expect(balance.subtract(expense).toString()).toBe("6.75");
    expect(balance.compareTo(expense)).toBe(1);
    expect(expense.compareTo(balance)).toBe(-1);
  });

  it("rejects malformed and non-positive positive inputs", () => {
    expect(() => Money.fromString("1.2.3", "ARS")).toThrow("decimal string");
    expect(() => Money.fromPositiveString("0", "ARS")).toThrow("greater than zero");
    expect(() => Money.fromPositiveString("-1", "ARS")).toThrow("greater than zero");
  });

  it("uses currency metadata for scale and formatting", () => {
    expect(getCurrencyMetadata("JPY").decimalPlaces).toBe(0);
    expect(Money.fromString("1234.56", "JPY").toString()).toBe("1235");
  });

  it("splits 100 into deterministic exact installments", () => {
    const parts = Money.fromPositiveString("100", "USD").split(3);

    expect(parts.map((part) => part.toString())).toEqual(["33.33", "33.33", "33.34"]);
    expect(parts.reduce((total, part) => total.add(part), Money.zero("USD")).toString())
      .toBe("100.00");
  });

  it("supports large exact values", () => {
    expect(Money.fromString("999999999999999999.99", "ARS").toString()).toBe(
      "999999999999999999.99",
    );
  });

  it("preserves the total for several installment counts", () => {
    for (const partsCount of [1, 2, 3, 7, 12]) {
      const parts = Money.fromPositiveString("1234.56", "USD").split(partsCount);
      const total = parts.reduce(
        (sum, part) => sum.add(part),
        Money.zero("USD"),
      );

      expect(total.toString()).toBe("1234.56");
    }
  });

  // WP-MONEY-SCALE: rounding happens once, at the final `toString()`, never per intermediate
  // `add`/`subtract` step — so a chain of sub-cent amounts (each individually below the
  // rounding threshold) still accumulates correctly instead of vanishing to zero.
  describe("settle-once semantics (WP-MONEY-SCALE)", () => {
    it("keeps the exact value on `.amount` before it's ever rounded", () => {
      const money = Money.fromString("0.004", "USD");
      expect(money.amount.toString()).toBe("0.004");
      expect(money.toString()).toBe("0.00");
    });

    it("three sub-cent amounts accumulate to a real cent instead of rounding away to zero at each step", () => {
      const subCent = Money.fromString("0.004", "USD");
      const sum = Money.zero("USD").add(subCent).add(subCent).add(subCent);

      // 0.004 + 0.004 + 0.004 = 0.012 → rounds once, at the end, to 0.01.
      // Under the old per-operation rounding, each 0.004 individually rounded to 0.00 first,
      // and 0.00 + 0.00 + 0.00 stayed 0.00 — three real charges would have disappeared.
      expect(sum.toString()).toBe("0.01");
    });

    it("subtracting back out an unsettled remainder returns to exactly zero, not a rounding artifact", () => {
      const a = Money.fromString("10.003", "ARS");
      const b = Money.fromString("10.003", "ARS");
      expect(a.subtract(b).toString()).toBe("0.00");
      expect(a.subtract(b).amount.isZero()).toBe(true);
    });
  });

  // WP-RECONCILIATION (gate G1): lock down the remaining Money surface so every method that a
  // financial calculation can reach has an explicit expectation.
  describe("full surface", () => {
    it("zero() is the additive identity and formats to the currency scale", () => {
      expect(Money.zero("USD").toString()).toBe("0.00");
      expect(Money.zero("JPY").toString()).toBe("0");
      expect(Money.zero("USD").isZero()).toBe(true);
      expect(Money.zero("USD").add(Money.fromString("5.00", "USD")).toString()).toBe("5.00");
    });

    it("equals is currency-aware and value-exact (compares unrounded amounts)", () => {
      expect(Money.fromString("1.00", "USD").equals(Money.fromString("1.00", "USD"))).toBe(true);
      expect(Money.fromString("1.00", "USD").equals(Money.fromString("1.00", "ARS"))).toBe(false);
      // Same settled value, different exact amount → not equal (equals does not round).
      expect(Money.fromString("1.004", "USD").equals(Money.fromString("1.00", "USD"))).toBe(false);
    });

    it("rounds half up at the minor-unit boundary, symmetrically for negatives", () => {
      expect(Money.fromString("2.005", "USD").toString()).toBe("2.01");
      expect(Money.fromString("-2.005", "USD").toString()).toBe("-2.01");
      expect(Money.fromString("2.004", "USD").toString()).toBe("2.00");
    });

    it("formats negative values with the sign and full scale", () => {
      expect(Money.fromString("10.00", "USD").subtract(Money.fromString("16.75", "USD")).toString()).toBe("-6.75");
    });

    it("normalises accepted decimal-string forms", () => {
      expect(Money.fromString("+1.5", "USD").toString()).toBe("1.50");
      expect(Money.fromString("  1.5  ", "USD").toString()).toBe("1.50");
      expect(Money.fromString(".5", "USD").toString()).toBe("0.50");
    });

    it("splits a zero-decimal currency into whole units", () => {
      const parts = Money.fromPositiveString("100", "JPY").split(3);
      expect(parts.map((p) => p.toString())).toEqual(["33", "33", "34"]);
    });

    it("rejects invalid split counts and negative amounts", () => {
      expect(() => Money.fromPositiveString("100", "USD").split(0)).toThrow("positive integer");
      expect(() => Money.fromPositiveString("100", "USD").split(2.5)).toThrow("positive integer");
      expect(() => Money.zero("USD").subtract(Money.fromString("1.00", "USD")).split(2)).toThrow("must not be negative");
    });
  });
});
