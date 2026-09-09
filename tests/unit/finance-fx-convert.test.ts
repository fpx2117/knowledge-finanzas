import { describe, expect, it } from "vitest";
import { convertAmount, isConvertiblePair, type FxQuote } from "@know-finanzas/finance";

// dólar blue: te compran los USD a 1000, te venden USD a 1050.
const BLUE: FxQuote = { base: "USD", quote: "ARS", bid: "1000", ask: "1050" };

describe("convertAmount (dólar blue)", () => {
  it("USD → ARS values holdings at compra (bid)", () => {
    expect(convertAmount("100", "USD", "ARS", BLUE)).toBe("100000.00");
  });

  it("ARS → USD uses venta (ask) — how much USD your pesos buy", () => {
    expect(convertAmount("105000", "ARS", "USD", BLUE)).toBe("100.00");
  });

  it("keeps the spread: a round trip loses value", () => {
    const pesos = convertAmount("100", "USD", "ARS", BLUE); // 100000
    const backToUsd = convertAmount(pesos, "ARS", "USD", BLUE); // 100000/1050
    expect(Number(backToUsd)).toBeLessThan(100);
    expect(backToUsd).toBe("95.24");
  });

  it("is an identity for same-currency, rounded to the minor unit", () => {
    expect(convertAmount("100.5", "ARS", "ARS", BLUE)).toBe("100.50");
  });

  it("rounds to the target currency's decimal places", () => {
    expect(convertAmount("1", "USD", "ARS", BLUE)).toBe("1000.00");
    expect(convertAmount("333", "ARS", "USD", BLUE)).toBe("0.32");
  });

  it("throws on an unrelated currency", () => {
    expect(() => convertAmount("10", "EUR", "ARS", BLUE)).toThrow();
  });

  it("rejects a non-positive quote", () => {
    expect(() => convertAmount("10", "USD", "ARS", { ...BLUE, bid: "0" })).toThrow();
  });
});

describe("isConvertiblePair", () => {
  it("accepts either direction of the quoted pair and same-currency", () => {
    expect(isConvertiblePair("USD", "ARS", BLUE)).toBe(true);
    expect(isConvertiblePair("ARS", "USD", BLUE)).toBe(true);
    expect(isConvertiblePair("ARS", "ARS", BLUE)).toBe(true);
  });

  it("rejects a currency outside the pair", () => {
    expect(isConvertiblePair("EUR", "ARS", BLUE)).toBe(false);
  });
});
