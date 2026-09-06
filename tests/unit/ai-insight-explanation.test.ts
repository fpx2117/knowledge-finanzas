import { describe, expect, it, vi } from "vitest";
import {
  buildInsightExplanationPrompt,
  explainInsight,
  insightExplanationSchema,
  type AIProvider,
} from "@know-finanzas/ai";

function fakeProvider(data: unknown): AIProvider {
  return {
    generateStructured: vi
      .fn()
      .mockResolvedValue({ data, raw: JSON.stringify(data), model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }),
  };
}

const insight = {
  family: "INS-BUDGET-LIMIT",
  title: "Presupuesto de Delivery excedido",
  body: "Ya gastaste $80.000 de un límite de $50.000.",
  evidence: { metrics: { spent: "80000", limit: "50000" }, period: { from: "2026-09-01", to: "2026-10-01" } },
};

describe("insight explanation prompt (spec 09 §20)", () => {
  it("grounds strictly on the given body + evidence and forbids recomputation", () => {
    const prompt = buildInsightExplanationPrompt(insight);
    expect(prompt).toContain("Use ONLY that data");
    expect(prompt).toContain("Never invent, recompute, or round");
    expect(prompt).toContain("do not contradict): Ya gastaste $80.000");
    expect(prompt).toContain('"spent":"80000"');
  });
});

describe("explainInsight", () => {
  it("makes a single structured FAST call for the insight.explain capability", async () => {
    const provider = fakeProvider({ explanation: "Gastaste más de lo previsto en Delivery este mes.", caveats: "Sólo cubre movimientos categorizados." });
    const result = await explainInsight(provider, insight);

    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.capability).toBe("insight.explain");
    expect(call.role).toBe("FAST");
    expect(result.explanation).toContain("Delivery");
    expect(insightExplanationSchema.safeParse(result).success).toBe(true);
  });
});
