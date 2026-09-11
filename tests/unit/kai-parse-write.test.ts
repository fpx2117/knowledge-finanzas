import { describe, expect, it } from "vitest";
import { normalizeText, parseActionIntent, parseAmount, parseWriteIntent } from "@know-finanzas/kai";

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

  it("does NOT fire when the number is a count, not money", () => {
    for (const q of ["cuánto gasté los últimos 3 meses", "gasté 3 veces esta semana", "cuánto gasté en total", "gasté 50% de mi sueldo"]) {
      expect(parseWriteIntent(normalizeText(q), q)).toBeNull();
    }
  });

  it("still fires when there IS a real amount", () => {
    expect(parseWriteIntent(normalizeText("gasté $50 en el kiosco"), "gasté $50 en el kiosco")?.kind).toBe("CREATE_EXPENSE");
    expect(parseWriteIntent(normalizeText("gasté 5000 en el super"), "gasté 5000 en el super")?.kind).toBe("CREATE_EXPENSE");
  });
});

describe("parseActionIntent — PAY_OBLIGATION", () => {
  it.each([
    ["pagué la cuota del auto", "auto"],
    ["pagá la tarjeta Visa", "visa"],
    ["aboné la cuota de la heladera", "heladera"],
    ["quiero pagar el préstamo del banco", "banco"],
  ])("'%s' → PAY_OBLIGATION (%s)", (raw, expected) => {
    const result = parseActionIntent(normalizeText(raw), raw);
    expect(result?.kind).toBe("PAY_OBLIGATION");
    expect((result as { obligationName: string }).obligationName).toContain(expected);
  });

  it("does NOT fire without a 'cuota/tarjeta/préstamo/deuda' noun — that stays a plain expense", () => {
    expect(parseActionIntent(normalizeText("pagué luz $5000"), "pagué luz $5000")).toBeNull();
    expect(parseActionIntent(normalizeText("pagué el super"), "pagué el super")).toBeNull();
  });
});

describe("parseActionIntent — CREATE_TRANSFER", () => {
  it("recognises 'transferí $10.000 de mi banco a mi billetera'", () => {
    const raw = "transferí $10.000 de mi banco a mi billetera";
    const result = parseActionIntent(normalizeText(raw), raw);
    expect(result).toMatchObject({ kind: "CREATE_TRANSFER", amount: "10000", fromAccountName: "banco", toAccountName: "billetera" });
  });

  it("recognises 'pasá 5000 de la cuenta corriente a la caja de ahorro'", () => {
    const raw = "pasá 5000 de la cuenta corriente a la caja de ahorro";
    const result = parseActionIntent(normalizeText(raw), raw);
    expect(result?.kind).toBe("CREATE_TRANSFER");
  });

  it("does NOT fire when it's an allocation to a goal (shares the verb 'moné/pasá')", () => {
    const raw = "moné 5000 a mi meta del auto";
    const result = parseActionIntent(normalizeText(raw), raw);
    expect(result?.kind).toBe("ALLOCATE_TO_GOAL");
  });

  it("returns null without amount when there's no clear 'de X a Y' shape", () => {
    expect(parseActionIntent(normalizeText("moví la reunión"), "moví la reunión")).toBeNull();
  });
});
