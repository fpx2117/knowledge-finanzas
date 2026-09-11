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

  it("does NOT treat a month or 'total' as a category", () => {
    expect(resolveIntent("cuánto gasté en junio").id).not.toBe("GET_CATEGORY_EXPENSES");
    expect(resolveIntent("cuánto gasté en total").id).not.toBe("GET_CATEGORY_EXPENSES");
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

  it("recognises 'este trimestre' / 'este año' / 'últimos 3 meses' / 'en {mes}'", () => {
    expect(resolveDateRange(normalizeText("gastos de este trimestre"), now, tz).kind).toBe("quarter");
    expect(resolveDateRange(normalizeText("cuánto gasté este año"), now, tz).kind).toBe("year");
    const l3 = resolveDateRange(normalizeText("cuánto gasté los últimos 3 meses"), now, tz);
    expect(l3.kind).toBe("range");
    expect(l3.label).toContain("3 meses");
    const inJune = resolveDateRange(normalizeText("cuánto gasté en junio"), now, tz);
    expect(inJune.kind).toBe("month");
    expect(inJune.label).toContain("junio");
  });
});

describe("temporal follow-up", () => {
  it("'¿y el mes pasado?' re-runs the last intent", () => {
    const r = resolveIntent("¿y el mes pasado?", undefined, "GET_MONTH_EXPENSES");
    expect(r.id).toBe("GET_MONTH_EXPENSES");
    expect(isConfident(r)).toBe(true);
  });

  it("without a last intent it stays UNRESOLVED", () => {
    expect(resolveIntent("¿y el mes pasado?").id).toBe("UNRESOLVED");
  });

  it("'¿gasté más que el mes pasado?' → GET_EXPENSE_COMPARISON", () => {
    const r = resolveIntent("¿gasté más que el mes pasado?");
    expect(r.id).toBe("GET_EXPENSE_COMPARISON");
  });

  // WP-KAI-RESOLVER-FUZZY (spec §15 step 7) — a typo shouldn't fall through to the LLM.
  describe("typo tolerance (fuzzy, last resort)", () => {
    it("a 1-edit typo on a long alias word still resolves, with lower confidence", () => {
      const r = resolveIntent("cuanto gasye este mes"); // "gasye" ~ "gaste"
      expect(r.id).toBe("GET_MONTH_EXPENSES");
      expect(r.strategy).toBe("fuzzy");
      expect(isConfident(r)).toBe(true);
      expect(r.confidence).toBeLessThan(0.95); // strictly weaker than an exact alias hit
    });

    it("a missing letter in 'presupuesto' still resolves", () => {
      expect(resolveIntent("como viene mi presupesto").id).toBe("GET_BUDGET_STATUS");
    });

    it("an unrelated short message stays UNRESOLVED, not a false fuzzy hit", () => {
      expect(resolveIntent("hola que tal").id).toBe("UNRESOLVED");
    });
  });
});
