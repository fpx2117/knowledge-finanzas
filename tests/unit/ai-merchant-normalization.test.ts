import { describe, expect, it, vi } from "vitest";
import { normalizeMerchant, merchantNormalizationSchema, type AIProvider } from "@know-finanzas/ai";

function fakeProvider(data: unknown): AIProvider {
  return { generateStructured: vi.fn().mockResolvedValue({ data, raw: JSON.stringify(data), model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }) };
}

describe("merchantNormalizationSchema", () => {
  it("accepts a null suggestion", () => {
    expect(merchantNormalizationSchema.safeParse({ normalizedMerchant: null, confidence: 0.9 }).success).toBe(true);
  });
});

describe("normalizeMerchant", () => {
  it("returns the trimmed normalized value on a confident suggestion", async () => {
    const provider = fakeProvider({ normalizedMerchant: "  Uber  ", confidence: 0.9 });
    const result = await normalizeMerchant(provider, { description: "UBER *TRIP 123", rawMerchant: "UBER *TRIP" });
    expect(result).toEqual({ normalizedMerchant: "Uber", confidence: 0.9 });
  });

  it("rejects an empty/whitespace-only suggestion as unsafe output", async () => {
    const provider = fakeProvider({ normalizedMerchant: "   ", confidence: 0.9 });
    const result = await normalizeMerchant(provider, { description: "x", rawMerchant: "x" });
    expect(result.normalizedMerchant).toBeNull();
  });

  it("discards a below-threshold suggestion", async () => {
    const provider = fakeProvider({ normalizedMerchant: "Uber", confidence: 0.2 });
    const result = await normalizeMerchant(provider, { description: "x", rawMerchant: "x" }, { minConfidence: 0.5 });
    expect(result.normalizedMerchant).toBeNull();
  });

  it("never sends a request that could mutate the raw description — it only reads it", async () => {
    const provider = fakeProvider({ normalizedMerchant: "Uber", confidence: 0.9 });
    await normalizeMerchant(provider, { description: "UBER *TRIP 123", rawMerchant: "UBER *TRIP" });
    const call = (provider.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.capability).toBe("merchant.normalize");
    expect(call.prompt).toContain("UBER *TRIP 123");
  });
});
