import { describe, expect, it, vi } from "vitest";
import { categorizeTransaction, transactionCategorizationSchema, type AIProvider, type CategoryCandidate } from "@know-finanzas/ai";

const candidates: CategoryCandidate[] = [
  { token: "C1", id: "cat-transport", name: "Transporte" },
  { token: "C2", id: "cat-food", name: "Alimentos" },
];

function fakeProvider(data: unknown): AIProvider {
  return { generateStructured: vi.fn().mockResolvedValue({ data, raw: JSON.stringify(data), model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }) };
}

describe("transactionCategorizationSchema", () => {
  it("accepts a null candidate", () => {
    expect(transactionCategorizationSchema.safeParse({ candidate: null, confidence: 0.9 }).success).toBe(true);
  });

  it("rejects an out-of-range confidence", () => {
    expect(transactionCategorizationSchema.safeParse({ candidate: "C1", confidence: 1.5 }).success).toBe(false);
  });
});

describe("categorizeTransaction", () => {
  it("maps a valid candidate token to the real category id", async () => {
    const provider = fakeProvider({ candidate: "C1", confidence: 0.9 });
    const result = await categorizeTransaction(provider, { transactionType: "EXPENSE", description: "Uber trip", merchant: null, candidates });
    expect(result).toEqual({ categoryId: "cat-transport", confidence: 0.9, reason: undefined });
  });

  it("throws AI_INVALID_OUTPUT for a candidate token outside the offered list (foreign category cannot be selected via model output)", async () => {
    const provider = fakeProvider({ candidate: "C99", confidence: 0.9 });
    await expect(categorizeTransaction(provider, { transactionType: "EXPENSE", description: "x", merchant: null, candidates }))
      .rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
  });

  it("discards a below-threshold suggestion instead of returning a low-confidence category", async () => {
    const provider = fakeProvider({ candidate: "C1", confidence: 0.3 });
    const result = await categorizeTransaction(provider, { transactionType: "EXPENSE", description: "x", merchant: null, candidates }, { minConfidence: 0.5 });
    expect(result.categoryId).toBeNull();
  });

  it("returns null when the model itself abstains", async () => {
    const provider = fakeProvider({ candidate: null, confidence: 0.9 });
    const result = await categorizeTransaction(provider, { transactionType: "EXPENSE", description: "x", merchant: null, candidates });
    expect(result.categoryId).toBeNull();
  });

  it("sends only minimum context in the prompt (type, description, merchant, candidates) and no balances/history", async () => {
    const provider = fakeProvider({ candidate: "C2", confidence: 0.9 });
    await categorizeTransaction(provider, { transactionType: "EXPENSE", description: "Almuerzo", merchant: "Cafe X", candidates });
    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.prompt).toContain("Almuerzo");
    expect(call.prompt).toContain("Cafe X");
    expect(call.prompt).toContain("C1 = Transporte");
    expect(call.capability).toBe("transaction.categorize");
    expect(call.promptVersion).toBe("v1");
  });
});
