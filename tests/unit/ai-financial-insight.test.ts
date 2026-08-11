import { describe, expect, it, vi } from "vitest";
import { explainFinancialInsight, INSIGHT_CAPABILITY_TOOLS, type AIProvider, type ContextBuilder } from "@know-finanzas/ai";

function fakeProvider(data: unknown): AIProvider {
  return { generateStructured: vi.fn().mockResolvedValue({ data, raw: JSON.stringify(data), model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }) };
}

function fakeContextBuilder(context: { results: Record<string, unknown>; failures: string[] }): ContextBuilder {
  return { buildContext: vi.fn().mockResolvedValue(context) };
}

describe("INSIGHT_CAPABILITY_TOOLS", () => {
  it("is a fixed allowlist per capability — no capability can reach an unlisted tool", () => {
    expect(INSIGHT_CAPABILITY_TOOLS["budget.explain"]).toEqual(["getBudgetOverview"]);
    expect(INSIGHT_CAPABILITY_TOOLS["cashflow.explain"]).toEqual(["getCashflowProjection", "getUpcomingObligations"]);
  });
});

describe("explainFinancialInsight", () => {
  it("builds context from exactly the capability's tool list and grounds the prompt in it", async () => {
    const contextBuilder = fakeContextBuilder({ results: { getBudgetOverview: [{ categoryName: "Comida", status: "NORMAL" }] }, failures: [] });
    const provider = fakeProvider({ answer: "Vas bien con tu presupuesto de comida.", sources: ["getBudgetOverview"] });

    const result = await explainFinancialInsight({ provider, contextBuilder }, { userId: "user-1", capability: "budget.explain" });

    expect(contextBuilder.buildContext).toHaveBeenCalledWith("user-1", ["getBudgetOverview"]);
    expect(result.sources).toEqual(["getBudgetOverview"]);

    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.capability).toBe("budget.explain");
    expect(call.prompt).toContain("getBudgetOverview");
    expect(call.prompt).toContain("Comida");
  });

  it("surfaces tool failures in the prompt so the model is told not to guess them", async () => {
    const contextBuilder = fakeContextBuilder({ results: {}, failures: ["getDebtSummary"] });
    const provider = fakeProvider({ answer: "No pudimos calcular tu deuda ahora mismo.", sources: [], limitations: "Datos de deuda no disponibles." });

    await explainFinancialInsight({ provider, contextBuilder }, { userId: "user-1", capability: "debt.explain" });

    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.prompt).toContain("getDebtSummary");
    expect(call.prompt).toContain("do not guess");
  });

  it("passes the user's free-text question through for assistant.query.simple", async () => {
    const contextBuilder = fakeContextBuilder({ results: {}, failures: [] });
    const provider = fakeProvider({ answer: "...", sources: [] });

    await explainFinancialInsight({ provider, contextBuilder }, { userId: "user-1", capability: "assistant.query.simple", question: "¿Cuánto gasté este mes?" });

    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.prompt).toContain("¿Cuánto gasté este mes?");
  });
});
