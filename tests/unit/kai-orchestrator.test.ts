import { describe, expect, it, vi } from "vitest";
import {
  resolveKaiInteraction,
  classifyLlmComplexity,
  KAI_LLM_COMPLEXITY_WEIGHT,
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
    getMerchantExpenses: async () => null,
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
    getGoalsForAllocation: async () => [{ id: "g1", name: "Viaje", currencyCode: "ARS" }],
    getObligationsForPayment: async () => [
      { id: "d1", name: "Auto", currencyCode: "ARS", nextInstallmentAmount: "60000", nextDueOn: "2026-09-20" },
    ],
    getAccountsForTransfer: async () => [
      { id: "a1", name: "Banco", currencyCode: "ARS" },
      { id: "a2", name: "Billetera", currencyCode: "ARS" },
    ],
    getCategoriesForEdit: async () => [
      { id: "c1", name: "Alimentación" },
      { id: "c2", name: "Transporte" },
    ],
    getInsightsForProactive: async () => [],
    findTransactionToVoid: async () => ({ id: "t1", type: "EXPENSE" as const, description: "Super", merchant: "Coto", amount: "40000", currencyCode: "ARS", occurredAt: "2026-09-09T12:00:00Z" }),
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
    const { response, audit, followups } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_MONTH_EXPENSES");
    expect(audit.resolutionSource).toBe("DATABASE");
    expect(audit.llmUsed).toBe(false);
    expect(response.type).toBe("KAI_METRIC");
    expect(response.body).toContain("850.000");
    expect(input.llmFallback).not.toHaveBeenCalled();
    // Follow-up chips are offered after the answer.
    expect(followups.length).toBeGreaterThan(0);
    expect(followups.map((f) => f.label)).toContain("¿En qué gasté más?");
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

  it("compares expenses against the previous period (KAI_COMPARISON)", async () => {
    let call = 0;
    const input = baseInput({
      message: "¿gasté más que el mes pasado?",
      ports: fakePorts({
        getMonthlySummary: async () => {
          call += 1;
          // 1st call = this month (145000), 2nd = previous (100000)
          return [{ currencyCode: "ARS", income: "500000", expense: call === 1 ? "145000" : "100000", net: "0" }];
        },
      }),
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_EXPENSE_COMPARISON");
    expect(response.type).toBe("KAI_COMPARISON");
    expect((response.data as { direction: string }).direction).toBe("up");
    expect((response.data as { variationPercent: number }).variationPercent).toBe(45);
  });

  it("projects month-end spend from the run-rate (GET_SPENDING_PROJECTION)", async () => {
    const input = baseInput({
      message: "¿cuánto voy a gastar este mes?",
      // now = 2026-09-10 → 10 of 30 days elapsed. spent 150000 → projected ~450000.
      ports: fakePorts({
        getMonthlySummary: async () => [{ currencyCode: "ARS", income: "600000", expense: "150000", net: "0" }],
      }),
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_SPENDING_PROJECTION");
    expect(audit.resolutionSource).toBe("CALCULATOR");
    expect(response.body).toMatch(/45[0-9]\.\d{3}|450\.000/);
  });

  it("'aportá $10.000 a la meta Viaje' → confirmación de aporte", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "aportá $10.000 a la meta Viaje" }));
    expect(audit.intentId).toBe("ALLOCATE_TO_GOAL");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Viaje");
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-goal-allocation", params: { goalId: "g1", amount: "10000" } });
  });

  it("'anulá el último gasto' → confirmación de anulación", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "anulá el último gasto" }));
    expect(audit.intentId).toBe("VOID_TRANSACTION");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Coto");
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-void", params: { transactionId: "t1" } });
  });

  it("'borrá el gasto de Coto' → VOID_TRANSACTION modo merchant", async () => {
    const { audit } = await resolveKaiInteraction(baseInput({ message: "borrá el gasto de Coto" }));
    expect(audit.intentId).toBe("VOID_TRANSACTION");
  });

  it("'pagué la cuota del auto' → confirmación de pago con el monto de la próxima cuota", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "pagué la cuota del auto" }));
    expect(audit.intentId).toBe("PAY_OBLIGATION");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Auto");
    expect(response.actions?.[0]).toMatchObject({
      kind: "confirm-pay-obligation",
      params: { debtId: "d1", amount: "60000" },
    });
  });

  it("'pagué luz $5000' sigue siendo CREATE_EXPENSE (sin 'cuota' no es una obligación)", async () => {
    const { audit } = await resolveKaiInteraction(baseInput({ message: "pagué luz $5000" }));
    expect(audit.intentId).toBe("CREATE_EXPENSE");
  });

  it("'transferí $10.000 de mi banco a mi billetera' → confirmación de transferencia", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "transferí $10.000 de mi banco a mi billetera" }));
    expect(audit.intentId).toBe("CREATE_TRANSFER");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Banco");
    expect(response.body).toContain("Billetera");
    expect(response.actions?.[0]).toMatchObject({
      kind: "confirm-transfer",
      params: { fromAccountId: "a1", toAccountId: "a2", amount: "10000" },
    });
  });

  it("'cambiá la categoría de mi último gasto a Transporte' → confirmación de edición", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "cambiá la categoría de mi último gasto a Transporte" }));
    expect(audit.intentId).toBe("EDIT_TRANSACTION_CATEGORY");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Transporte");
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-edit-category", params: { transactionId: "t1", categoryId: "c2" } });
  });

  it("'creá una meta de $500.000 para Viaje' → confirmación de creación de meta", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "creá una meta de $500.000 para Viaje" }));
    expect(audit.intentId).toBe("CREATE_GOAL");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.body).toContain("Viaje");
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-create-goal", params: { name: "Viaje", targetAmount: "500000", category: "TRAVEL" } });
  });

  it("'creá un presupuesto de $200.000 para Transporte' → confirmación de creación de presupuesto", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "creá un presupuesto de $200.000 para Transporte" }));
    expect(audit.intentId).toBe("CREATE_BUDGET");
    expect(response.type).toBe("KAI_CONFIRMATION");
    expect(response.actions?.[0]).toMatchObject({ kind: "confirm-create-budget", params: { categoryId: "c2", limitAmount: "200000" } });
  });

  it("'creá una meta para Viaje' sin monto → KAI lo pregunta", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "creá una meta para Viaje" }));
    expect(audit.intentId).toBe("CREATE_GOAL");
    expect(response.type).toBe("KAI_ACTION");
    expect(response.body).toContain("Viaje");
  });

  it("'¿cuándo vence Netflix?' → GET_SUBSCRIPTION_NEXT", async () => {
    const { response, audit } = await resolveKaiInteraction(baseInput({ message: "¿cuándo vence Netflix?" }));
    expect(audit.intentId).toBe("GET_SUBSCRIPTION_NEXT");
    expect(response.body).toContain("Netflix");
    expect(response.body).toContain("13 de septiembre");
  });

  it("'¿cuánto gasté en Coto?' falls back to merchant spend when it's not a category", async () => {
    const input = baseInput({
      message: "¿cuánto gasté en coto?",
      ports: fakePorts({
        getCategoryExpenses: async () => null,
        getMerchantExpenses: async () => ({ label: "Coto", count: 3, byCurrency: [{ currencyCode: "ARS", amount: "62000" }] }),
      }),
    });
    const { response, audit } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_CATEGORY_EXPENSES");
    expect(response.body).toContain("Coto");
    expect(response.body).toContain("3 movimientos");
  });

  it("'¿y el mes pasado?' re-runs the last intent with a shifted range", async () => {
    const input = baseInput({ message: "¿y el mes pasado?", lastIntentId: "GET_MONTH_EXPENSES" });
    const { audit, response } = await resolveKaiInteraction(input);
    expect(audit.intentId).toBe("GET_MONTH_EXPENSES");
    expect(response.body).toContain("mes pasado");
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
    expect(audit.reasonForLlm).toBe("unresolved");
    // "por qué" is reasoning language (spec §17 WP-KAI-LLM-COMPLEX) — costs 10, not 5.
    expect(audit.weight).toBe(10);
    expect(input.llmFallback).toHaveBeenCalledWith(expect.objectContaining({ complexity: "complex" }));
  });

  it("an ordinary unresolved phrasing (no reasoning language) stays a simple, 5-point LLM call", async () => {
    const input = baseInput({ message: "contame algo random sobre mi cuenta bancaria" });
    const { audit } = await resolveKaiInteraction(input);
    expect(audit.resolutionSource).toBe("LLM");
    expect(audit.weight).toBe(5);
    expect(input.llmFallback).toHaveBeenCalledWith(expect.objectContaining({ complexity: "simple" }));
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
    expect(audit.reasonForLlm).toBe("unresolved");
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
    expect(audit.reasonForLlm).toBe("handler-error");
  });
});

describe("classifyLlmComplexity (spec §17 WP-KAI-LLM-COMPLEX)", () => {
  it.each([
    "¿por qué gasté tanto este mes?",
    "¿me conviene pagar la tarjeta antes de fin de mes?",
    "¿qué me recomendás para ahorrar más?",
    "no sé si tiene sentido seguir pagando esta suscripción",
    "ayudame a decidir si compro el auto ahora o espero",
  ])("'%s' is complex", (message) => {
    expect(classifyLlmComplexity(message)).toBe("complex");
  });

  it.each([
    "contame un chiste",
    "¿cómo estás?",
    "decime algo interesante sobre mis finanzas",
  ])("'%s' is simple", (message) => {
    expect(classifyLlmComplexity(message)).toBe("simple");
  });

  it("complex costs 10 KAI points, simple costs the standard LLM weight (5)", () => {
    expect(KAI_LLM_COMPLEXITY_WEIGHT.complex).toBe(10);
    expect(KAI_LLM_COMPLEXITY_WEIGHT.simple).toBe(5);
  });
});
