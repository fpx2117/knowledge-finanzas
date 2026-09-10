import { describe, expect, it, vi } from "vitest";
import {
  resolveKaiInteraction,
  type KaiDataPorts,
  type ResolveKaiInteractionInput,
} from "@know-finanzas/kai";

const now = new Date("2026-09-10T15:00:00Z");
const timezone = "America/Argentina/Buenos_Aires";

function fakePorts(overrides: Partial<KaiDataPorts> = {}): KaiDataPorts {
  return {
    getMonthlySummary: async () => [{ currencyCode: "ARS", income: "1200000", expense: "850000", net: "350000" }],
    getLiquidBalances: async () => [{ currencyCode: "ARS", amount: "500000" }],
    getAccountBalances: async () => [{ name: "Banco", currencyCode: "ARS", balance: "500000" }],
    getSpendable: async () => [{ currencyCode: "ARS", spendable: "300000" }],
    getCategoryExpenses: async () => ({ label: "Alimentación", byCurrency: [{ currencyCode: "ARS", amount: "280000" }] }),
    getTopExpenseCategories: async () => [{ label: "Vivienda", amount: "420000", currencyCode: "ARS" }],
    getRecentExpenses: async () => [
      { description: "Super", merchant: "Coto", categoryName: "Alimentación", amount: "40000", currencyCode: "ARS", occurredAt: "2026-09-09" },
    ],
    getUpcomingObligations: async () => [
      { title: "Netflix", dueDate: "2026-09-13", amount: "5000", currencyCode: "ARS", daysUntilDue: 3, isOverdue: false },
    ],
    getActiveSubscriptions: async () => [
      { label: "Netflix", frequency: "MONTHLY", currentAmount: "5000", currencyCode: "ARS", nextExpectedOn: "2026-09-13" },
    ],
    getBudgetStatus: async () => [
      { name: "Comida", status: "NORMAL", usagePercent: 40, limit: "300000", spent: "120000", currencyCode: "ARS" },
    ],
    getGoalProgress: async () => [
      { name: "Viaje", status: "ON_TRACK", currentAmount: "250000", targetAmount: "1000000", currencyCode: "ARS", actualProgressRatio: 0.25, requiredMonthly: "75000" },
    ],
    getTopInsight: async () => null,
    ...overrides,
  };
}

function baseInput(over: Partial<ResolveKaiInteractionInput> = {}): ResolveKaiInteractionInput {
  return {
    message: "",
    screenContext: "DASHBOARD",
    history: [],
    ports: fakePorts(),
    llmFallback: vi.fn(async () => ({ response: { type: "KAI_TEXT", state: "NEUTRAL", body: "respuesta IA" }, aiCostUsd: 0.0012 })),
    budgetGuard: vi.fn(async () => {}),
    now,
    timezone,
    baseCurrency: "ARS",
    ...over,
  };
}

describe("resolveKaiInteraction", () => {
  it("answers a navigation question from the static layer, no LLM", async () => {
    const input = baseInput({ message: "¿dónde agrego una cuenta?" });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.resolutionSource).toBe("STATIC");
    expect(audit.llmUsed).toBe(false);
    expect(audit.aiCostUsd).toBe(0);
    expect(response.actions?.[0]).toMatchObject({ route: "/accounts" });
    expect(input.llmFallback).not.toHaveBeenCalled();
    expect(input.budgetGuard).not.toHaveBeenCalled();
  });

  it("answers 'cuánto gasté este mes' deterministically from the DB", async () => {
    const input = baseInput({ message: "¿cuánto gasté este mes?" });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_MONTH_EXPENSES");
    expect(audit.resolutionSource).toBe("DATABASE");
    expect(audit.llmUsed).toBe(false);
    expect(response.type).toBe("KAI_METRIC");
    expect(response.body).toContain("850.000");
    expect(input.llmFallback).not.toHaveBeenCalled();
  });

  it("returns a donut chart for 'gastos por categoría'", async () => {
    const input = baseInput({
      message: "mostrame mis gastos por categoría",
      ports: fakePorts({
        getTopExpenseCategories: async () => [
          { label: "Vivienda", amount: "420000", currencyCode: "ARS" },
          { label: "Alimentación", amount: "280000", currencyCode: "ARS" },
          { label: "Transporte", amount: "145000", currencyCode: "ARS" },
        ],
      }),
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_TOP_EXPENSE_CATEGORIES");
    expect(response.type).toBe("KAI_CHART");
    const chart = (response.data as { chart?: { segments: unknown[]; currencyCode: string } }).chart;
    expect(chart?.currencyCode).toBe("ARS");
    expect(chart?.segments).toHaveLength(3);
  });

  it("returns a dated table for 'próximas obligaciones'", async () => {
    const input = baseInput({
      message: "próximas obligaciones",
      ports: fakePorts({
        getUpcomingObligations: async () => [
          { title: "Netflix", dueDate: "2026-09-13", amount: "5000", currencyCode: "ARS", daysUntilDue: 3, isOverdue: false },
          { title: "Tarjeta", dueDate: "2026-09-09", amount: "80000", currencyCode: "ARS", daysUntilDue: -1, isOverdue: true },
        ],
      }),
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_UPCOMING_PAYMENTS");
    expect(response.type).toBe("KAI_TABLE");
    const table = (response.data as { table?: { columns: string[]; rows: string[][] } }).table;
    expect(table?.columns).toEqual(["Vence", "Concepto", "Monto"]);
    expect(table?.rows).toHaveLength(2);
    expect(table?.rows[1][0]).toBe("Vencido");
  });

  it("computes savings via the calculator source", async () => {
    const { audit, response } = await resolveKaiInteraction(baseInput({ message: "¿cuánto estoy ahorrando?" }));
    expect(audit.resolutionSource).toBe("CALCULATOR");
    expect(response.body).toContain("29,2%");
  });

  it("runs a quick-action intent id directly", async () => {
    const input = baseInput({ message: "", quickActionIntentId: "GET_UPCOMING_PAYMENTS" });
    const { audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_UPCOMING_PAYMENTS");
    expect(audit.resolutionSource).toBe("DATABASE");
  });

  it("falls back to the LLM once, after the budget guard, when unresolved", async () => {
    const input = baseInput({ message: "¿por qué nunca llego a fin de mes?" });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(input.budgetGuard).toHaveBeenCalledTimes(1);
    expect(input.llmFallback).toHaveBeenCalledTimes(1);
    expect(audit.resolutionSource).toBe("LLM");
    expect(audit.llmUsed).toBe(true);
    expect(audit.aiCostUsd).toBeCloseTo(0.0012);
    expect(response.body).toBe("respuesta IA");
  });

  it("returns KAI_ERROR and never calls the LLM when the budget guard throws", async () => {
    const llmFallback = vi.fn();
    const input = baseInput({
      message: "explicame mis finanzas en detalle por favor",
      budgetGuard: vi.fn(async () => {
        throw new Error("Alcanzaste el límite diario de análisis con IA.");
      }),
      llmFallback,
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(response.type).toBe("KAI_ERROR");
    expect(response.body).toContain("límite diario");
    expect(audit.llmUsed).toBe(false);
    expect(llmFallback).not.toHaveBeenCalled();
  });

  it("turns 'creá un gasto de YPF de $30.000' into a confirmation, no LLM, no DB", async () => {
    const input = baseInput({ message: "Quiero que crees un gasto de YPF de $30.000" });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("CREATE_EXPENSE");
    expect(audit.resolutionSource).toBe("TEMPLATE");
    expect(audit.llmUsed).toBe(false);
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("YPF");
    expect(response.body).toMatch(/30\.000/);
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-create", params: { type: "EXPENSE", amount: "30000" } });
    expect(input.llmFallback).not.toHaveBeenCalled();
  });

  it("a concrete write command beats the 'cómo registro un gasto' static help", async () => {
    const input = baseInput({ message: "Quiero registrar un gasto en YPF de $30.000" });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("CREATE_EXPENSE");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toMatch(/30\.000/);
    expect(response.body).toContain("YPF");
  });

  it("opens the form (no confirmation) when a create has no amount", async () => {
    const { response } = await resolveKaiInteraction(baseInput({ message: "registrá un gasto en Carrefour" }));
    expect(response.type).toBe("KAI_ACTION");
    expect(response.actions?.[0]).toMatchObject({ kind: "open-quick-add" });
  });

  it("still answers 'cuánto gasté en comida' as a category question", async () => {
    const { audit } = await resolveKaiInteraction(baseInput({ message: "¿cuánto gasté en comida?" }));
    expect(audit.intentId).toBe("GET_CATEGORY_EXPENSES");
  });

  it("falls back to the LLM when a handler throws", async () => {
    const input = baseInput({
      message: "¿cuánto gasté este mes?",
      ports: fakePorts({ getMonthlySummary: async () => { throw new Error("db down"); } }),
    });
    const { audit } = await resolveKaiInteraction(input);
    expect(audit.resolutionSource).toBe("LLM");
    expect(input.llmFallback).toHaveBeenCalledTimes(1);
  });
});
