import { describe, expect, it } from "vitest";
import { normalizeText, parseAmount, parseWriteIntent } from "@know-finanzas/kai";

describe("parseAmount", () => {
  it.each([
    ["$30.000", "30000"],
    ["30.000", "30000"],
    ["30000", "30000"],
    ["$ 1.234,50", "1234.5"],
    ["30 mil", "30000"],
    ["1,5 millones", "1500000"],
    ["30k", "30000"],
  ])("parses %j → %s", (text, expected) => {
    expect(parseAmount(text.toLowerCase()).amount).toBe(expected);
  });

  it("flags USD", () => {
    expect(parseAmount("usd 50").currencyHint).toBe("USD");
    expect(parseAmount("us$ 50").currencyHint).toBe("USD");
  });

  it("returns null when there is no amount", () => {
    expect(parseAmount("un gasto en el super").amount).toBeNull();
  });
});

describe("parseWriteIntent", () => {
  it("recognises 'creá un gasto de YPF de $30.000'", () => {
    const raw = "Quiero que crees un gasto de YPF de $30.000";
    const result = parseWriteIntent(normalizeText(raw), raw);
    expect(result).toMatchObject({ kind: "CREATE_EXPENSE", amount: "30000", merchant: "YPF" });
  });

  it("recognises 'gasté 5000 en el super'", () => {
    const raw = "gasté 5000 en el super";
    const result = parseWriteIntent(normalizeText(raw), raw);
    expect(result).toMatchObject({ kind: "CREATE_EXPENSE", amount: "5000" });
    expect(result?.merchant?.toLowerCase()).toContain("super");
  });

  it("recognises an income", () => {
    const raw = "registrá un ingreso de $200.000 de sueldo";
    const result = parseWriteIntent(normalizeText(raw), raw);
    expect(result).toMatchObject({ kind: "CREATE_INCOME", amount: "200000" });
  });

  it("returns a create with null amount when none is given", () => {
    const result = parseWriteIntent(normalizeText("anotá un gasto en Carrefour"), "anotá un gasto en Carrefour");
    expect(result).toMatchObject({ kind: "CREATE_EXPENSE", amount: null });
    expect(result?.merchant?.toLowerCase()).toContain("carrefour");
  });

  it("does NOT fire on a question", () => {
    expect(parseWriteIntent(normalizeText("cuánto gasté este mes"), "cuánto gasté este mes")).toBeNull();
    expect(parseWriteIntent(normalizeText("cuánto gasté en comida"), "cuánto gasté en comida")).toBeNull();
    expect(parseWriteIntent(normalizeText("mis gastos"), "mis gastos")).toBeNull();
  });
});
