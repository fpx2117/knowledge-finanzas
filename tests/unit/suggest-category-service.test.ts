import { describe, expect, it, vi } from "vitest";
import { AIError, type AIProvider, type ExecuteAICapability } from "@know-finanzas/ai";
import { createSuggestTransactionCategoryService } from "../../apps/web/src/features/transactions/services/suggest-category-service";

function fakeCategories(records: Array<{ id: string; name: string }>) {
  return { listForUser: vi.fn().mockResolvedValue(records) };
}

describe("createSuggestTransactionCategoryService", () => {
  it("loads only the user's active categories for the transaction's type and builds candidate tokens", async () => {
    const categories = fakeCategories([{ id: "cat-1", name: "Transporte" }, { id: "cat-2", name: "Alimentos" }]);
    const executeAICapability: ExecuteAICapability = vi.fn(async (input) => input.execute()) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn() } as unknown as AIProvider;

    const service = createSuggestTransactionCategoryService({ categories, provider, executeAICapability });
    provider.generateStructured = vi.fn().mockResolvedValue({ data: { candidate: "C2", confidence: 0.9 }, raw: "{}", model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" });

    const result = await service.suggestCategory("user-1", { transactionType: "EXPENSE", description: "Almuerzo", merchant: null, operationId: "op-1" });

    expect(categories.listForUser).toHaveBeenCalledWith("user-1", { type: "EXPENSE" });
    expect(result.categoryId).toBe("cat-2");
    expect(executeAICapability).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1" }));
  });

  it("propagates AI_CREDITS_EXHAUSTED without ever calling the provider when executeAICapability denies the reservation", async () => {
    const categories = fakeCategories([{ id: "cat-1", name: "Transporte" }]);
    const executeAICapability: ExecuteAICapability = vi.fn(async () => { throw new AIError("AI_CREDITS_EXHAUSTED"); }) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn() } as unknown as AIProvider;

    const service = createSuggestTransactionCategoryService({ categories, provider, executeAICapability });

    await expect(service.suggestCategory("user-1", { transactionType: "EXPENSE", description: "x", merchant: null, operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_CREDITS_EXHAUSTED" });
    expect(provider.generateStructured).not.toHaveBeenCalled();
  });

  it("propagates AI_DISABLED when the kill switch is off", async () => {
    const categories = fakeCategories([]);
    const executeAICapability: ExecuteAICapability = vi.fn(async () => { throw new AIError("AI_DISABLED"); }) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn() } as unknown as AIProvider;

    const service = createSuggestTransactionCategoryService({ categories, provider, executeAICapability });

    await expect(service.suggestCategory("user-1", { transactionType: "EXPENSE", description: "x", merchant: null, operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_DISABLED" });
  });

  it("propagates a provider failure as AI_PROVIDER_ERROR without leaving a false suggestion", async () => {
    const categories = fakeCategories([{ id: "cat-1", name: "Transporte" }]);
    const executeAICapability: ExecuteAICapability = vi.fn(async (input) => input.execute()) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn().mockRejectedValue(new AIError("AI_PROVIDER_ERROR")) } as unknown as AIProvider;

    const service = createSuggestTransactionCategoryService({ categories, provider, executeAICapability });

    await expect(service.suggestCategory("user-1", { transactionType: "EXPENSE", description: "x", merchant: null, operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
  });
});
