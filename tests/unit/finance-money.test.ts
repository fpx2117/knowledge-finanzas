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
});
