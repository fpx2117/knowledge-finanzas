import { describe, expect, it } from "vitest";

import { parseTransactionText } from "../../apps/web/src/features/capture/lib/parse-transaction-text";

describe("parseTransactionText", () => {
  it.each([
    ["gasté 14k en nafta con Galicia", "EXPENSE", "14000.00", "Nafta", "galicia"],
    ["pagué 32 mil de internet", "EXPENSE", "32000.00", null, null],
    ["cobré 1.200.000 de sueldo", "INCOME", "1200000.00", null, null],
    ["compré $14.500,50 en Carrefour", "EXPENSE", "14500.50", "Carrefour", null],
    ["gasté 1,5 millones en una casa", "EXPENSE", "1500000.00", "Una Casa", null],
    ["pagué 2 lucas de café", "EXPENSE", "2000.00", "Café", null],
  ])(
    "interpreta %s",
    (text, type, amount, merchantText, institutionText) => {
      expect(parseTransactionText(text)).toMatchObject({
        type,
        amount,
        merchantText,
        institutionText,
      });
    },
  );

  it("trata el origen de un ingreso como concepto y nunca como comercio", () => {
    expect(parseTransactionText("me pagaron 250 mil de honorarios")).toMatchObject({
      type: "INCOME",
      amount: "250000.00",
      description: "Honorarios",
      merchantText: null,
    });
  });

  it("mantiene una transferencia fuera de ingresos y gastos", () => {
    expect(parseTransactionText("transferí 50.000 a mercado pago")).toMatchObject({
      type: "TRANSFER",
      amount: "50000.00",
      description: "Transferencia a mercado pago",
      merchantText: null,
      institutionText: "mercado pago",
    });
  });

  it("declara las suposiciones cuando faltan verbo y monto", () => {
    expect(parseTransactionText("Carrefour")).toMatchObject({
      type: "EXPENSE",
      amount: null,
      ambiguities: ["No pude leer un monto.", "Asumí que es un gasto."],
    });
  });
});
