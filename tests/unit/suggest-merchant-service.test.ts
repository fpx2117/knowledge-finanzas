import { describe, expect, it, vi } from "vitest";
import { AIError, type AIProvider, type ExecuteAICapability } from "@know-finanzas/ai";
import { createSuggestMerchantService } from "../../apps/web/src/features/transactions/services/suggest-merchant-service";

describe("createSuggestMerchantService", () => {
  it("calls executeAICapability with the merchant.normalize capability and a stable operationId", async () => {
    const executeAICapability: ExecuteAICapability = vi.fn(async (input) => input.execute()) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn().mockResolvedValue({ data: { normalizedMerchant: "Uber", confidence: 0.9 }, raw: "{}", model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }) } as unknown as AIProvider;

    const service = createSuggestMerchantService({ provider, executeAICapability });
    const result = await service.suggestMerchant("user-1", { description: "UBER *TRIP", rawMerchant: "UBER *TRIP", operationId: "op-1" });

    expect(executeAICapability).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", capability: "merchant.normalize", operationId: "op-1" }));
    expect(result).toEqual({ normalizedMerchant: "Uber", confidence: 0.9 });
  });

  it("propagates AI_USAGE_RATE_LIMITED without calling the provider", async () => {
    const executeAICapability: ExecuteAICapability = vi.fn(async () => { throw new AIError("AI_USAGE_RATE_LIMITED"); }) as unknown as ExecuteAICapability;
    const provider = { generateStructured: vi.fn() } as unknown as AIProvider;

    const service = createSuggestMerchantService({ provider, executeAICapability });

    await expect(service.suggestMerchant("user-1", { description: "x", rawMerchant: null, operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_USAGE_RATE_LIMITED" });
    expect(provider.generateStructured).not.toHaveBeenCalled();
  });
});
