import { describe, expect, it } from "vitest";
import { getModelCapabilities, resolveModel, validateModelCompatibility } from "@know-finanzas/ai";

const config = { fast: "openai/gpt-4o-mini", balanced: "openai/gpt-4o", quality: "openai/gpt-4o", reasoning: "openai/o1" };

describe("model registry", () => {
  it("resolves the configured model id for each role", () => {
    expect(resolveModel("FAST", config)).toBe("openai/gpt-4o-mini");
    expect(resolveModel("BALANCED", config)).toBe("openai/gpt-4o");
    expect(resolveModel("QUALITY", config)).toBe("openai/gpt-4o");
    expect(resolveModel("REASONING", config)).toBe("openai/o1");
  });

  it("throws AI_MODEL_UNAVAILABLE when a role has no configured model", () => {
    expect(() => resolveModel("FAST", { ...config, fast: undefined })).toThrow("AI_MODEL_UNAVAILABLE");
  });
});

describe("model capabilities", () => {
  it("declares structured outputs supported for every role", () => {
    for (const role of ["FAST", "BALANCED", "QUALITY", "REASONING"] as const) {
      expect(getModelCapabilities(role).structuredOutputs).toBe(true);
    }
  });

  it("only the REASONING role declares reasoning support", () => {
    expect(getModelCapabilities("REASONING").reasoning).toBe(true);
    expect(getModelCapabilities("FAST").reasoning).toBe(false);
  });

  it("accepts a request whose required capabilities are supported", () => {
    expect(() => validateModelCompatibility("FAST", { structuredOutputs: true })).not.toThrow();
  });

  it("rejects a request whose required capability is unsupported by the role", () => {
    expect(() => validateModelCompatibility("FAST", { toolCalling: true })).toThrow("AI_MODEL_UNSUPPORTED");
  });
});
