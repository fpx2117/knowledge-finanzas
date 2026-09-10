import { describe, expect, it } from "vitest";
import { isConfident, normalizeText, resolveDateRange, resolveIntent } from "@know-finanzas/kai";

describe("normalizeText", () => {
  it("lower-cases, strips accents and punctuation", () => {
    expect(normalizeText("  ¿Cuánto GASTÉ, che? ")).toBe("cuanto gaste che");
  });
});

describe("resolveIntent", () => {
  const cases: Array<[string, string]> = [
    ["cuánto gasté este mes", "GET_MONTH_EXPENSES"],
    ["mis gastos", "GET_MONTH_EXPENSES"],
    ["gastos del mes", "GET_MONTH_EXPENSES"],
    ["cuanto llevo gastado", "GET_MONTH_EXPENSES"],
    ["cuánto tengo", "GET_CURRENT_BALANCE"],
    ["mi saldo", "GET_CURRENT_BALANCE"],
    ["plata disponible", "GET_AVAILABLE_MONEY"],
    ["cuánto tengo disponible", "GET_AVAILABLE_MONEY"],
    ["cuánto puedo gastar", "GET_AVAILABLE_MONEY"],
    ["pagué 30 mil de luz", "CREATE_EXPENSE"],
    ["compré nafta en YPF por 30000", "CREATE_EXPENSE"],
    ["qué vence", "GET_UPCOMING_PAYMENTS"],
    ["próximos pagos", "GET_UPCOMING_PAYMENTS"],
    ["vencimientos", "GET_UPCOMING_PAYMENTS"],
    ["cómo viene mi presupuesto", "GET_BUDGET_STATUS"],
    ["cómo viene mi meta", "GET_GOAL_PROGRESS"],
    ["cuánto ahorré", "GET_MONTH_SAVINGS"],
    ["cuántas suscripciones tengo", "GET_SUBSCRIPTIONS"],
    ["cuál fue mi mayor gasto", "GET_LARGEST_EXPENSE"],
    ["en qué gasté más", "GET_TOP_EXPENSE_CATEGORIES"],
  ];

  it.each(cases)("maps %j → %s with confidence over threshold", (text, expected) => {
    const resolved = resolveIntent(text);
    expect(resolved.id).toBe(expected);
    expect(isConfident(resolved)).toBe(true);
  });

  it("extracts the category from 'gasté en {category}'", () => {
    const resolved = resolveIntent("cuánto gasté en comida");
    expect(resolved.id).toBe("GET_CATEGORY_EXPENSES");
    expect(resolved.params.category).toBe("comida");
  });

  it("honours an explicit quick-action intent id", () => {
    const resolved = resolveIntent("", "GET_BUDGET_STATUS");
    expect(resolved).toMatchObject({ id: "GET_BUDGET_STATUS", confidence: 1, strategy: "quick-action" });
  });

  it("returns UNRESOLVED for open-ended questions", () => {
    const resolved = resolveIntent("por qué siento que nunca llego a fin de mes");
    expect(resolved.id).toBe("UNRESOLVED");
    expect(isConfident(resolved)).toBe(false);
  });
});

describe("resolveDateRange", () => {
  const tz = "America/Argentina/Buenos_Aires";
  const now = new Date("2026-09-10T15:00:00Z");

  it("defaults to the current month", () => {
    const range = resolveDateRange(normalizeText("cuánto gasté"), now, tz);
    expect(range.kind).toBe("month");
    expect(range.label).toBe("este mes");
  });

  it("recognises 'ayer'", () => {
    const range = resolveDateRange(normalizeText("cuánto gasté ayer"), now, tz);
    expect(range.kind).toBe("day");
    expect(range.label).toBe("ayer");
    expect(range.to.getTime() - range.from.getTime()).toBeLessThanOrEqual(25 * 3_600_000);
  });

  it("recognises 'esta semana'", () => {
    const range = resolveDateRange(normalizeText("qué gasté esta semana"), now, tz);
    expect(range.kind).toBe("week");
  });

  it("recognises 'el mes pasado'", () => {
    const range = resolveDateRange(normalizeText("cuánto gasté el mes pasado"), now, tz);
    expect(range.kind).toBe("month");
    expect(range.label).toBe("el mes pasado");
  });
});
