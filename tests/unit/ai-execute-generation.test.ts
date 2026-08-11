import { describe, expect, it, vi } from "vitest";
import { createAIExecutor, type AIProvider, type GenerateStructuredInput } from "@know-finanzas/ai";

function fakeProvider(result: unknown, error?: Error) {
  const calls: unknown[] = [];
  return {
    calls,
    generateStructured: vi.fn(async (input: GenerateStructuredInput<unknown>) => {
      calls.push(input);
      if (error) throw error;
      return result;
    }),
  } as unknown as AIProvider & { calls: unknown[] };
}

const baseInput: GenerateStructuredInput<unknown> = {
  role: "FAST",
  capability: "transaction.categorize",
  promptVersion: "v1",
  prompt: "categorize",
  schema: { parse: (v: unknown) => v } as never,
  schemaName: "s",
};

describe("AI executor (execute-generation)", () => {
  it("blocks execution with AI_DISABLED and never calls the provider when the kill switch is off", async () => {
    const provider = fakeProvider({ data: {}, raw: "{}", model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" });
    const executor = createAIExecutor({ provider, aiEnabled: false });

    await expect(executor.generateStructured("user-1", baseInput)).rejects.toMatchObject({ code: "AI_DISABLED" });
    expect(provider.generateStructured).not.toHaveBeenCalled();
  });

  it("blocks execution with AI_ACCESS_REQUIRED when the entitlement check denies access", async () => {
    const provider = fakeProvider({});
    const executor = createAIExecutor({ provider, aiEnabled: true, checkEntitlement: async () => false });

    await expect(executor.generateStructured("user-1", baseInput)).rejects.toMatchObject({ code: "AI_ACCESS_REQUIRED" });
    expect(provider.generateStructured).not.toHaveBeenCalled();
  });

  it("blocks execution with AI_CREDITS_EXHAUSTED when the reservation is denied", async () => {
    const provider = fakeProvider({});
    const executor = createAIExecutor({ provider, aiEnabled: true, reserveUsage: async () => ({ allowed: false }) });

    await expect(executor.generateStructured("user-1", baseInput)).rejects.toMatchObject({ code: "AI_CREDITS_EXHAUSTED" });
    expect(provider.generateStructured).not.toHaveBeenCalled();
  });

  it("commits the reservation and records safe telemetry (no prompt/raw content) on success", async () => {
    const result = { data: { ok: true }, raw: "raw output", model: "resolved-model", usage: { inputTokens: 10, outputTokens: 5 }, generationId: "gen-1" };
    const provider = fakeProvider(result);
    const commitUsage = vi.fn().mockResolvedValue(undefined);
    const releaseUsage = vi.fn().mockResolvedValue(undefined);
    const record = vi.fn().mockResolvedValue(undefined);
    const executor = createAIExecutor({
      provider, aiEnabled: true,
      reserveUsage: async () => ({ allowed: true, reservationId: "res-1" }),
      commitUsage, releaseUsage,
      telemetry: { record },
      now: () => 1000,
    });

    const returned = await executor.generateStructured("user-1", baseInput);

    expect(returned).toBe(result);
    expect(commitUsage).toHaveBeenCalledWith({ userId: "user-1", reservationId: "res-1" });
    expect(releaseUsage).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledTimes(1);
    const event = record.mock.calls[0][0];
    expect(event).toMatchObject({ userId: "user-1", capability: "transaction.categorize", status: "SUCCESS", resolvedModel: "resolved-model", inputTokens: 10, outputTokens: 5 });
    expect(Object.keys(event)).not.toContain("raw");
    expect(Object.keys(event)).not.toContain("prompt");
  });

  it("releases the reservation and records a FAILED telemetry event when the provider throws", async () => {
    const { AIError } = await import("@know-finanzas/ai");
    const provider = fakeProvider(null, new AIError("AI_PROVIDER_ERROR"));
    const commitUsage = vi.fn().mockResolvedValue(undefined);
    const releaseUsage = vi.fn().mockResolvedValue(undefined);
    const record = vi.fn().mockResolvedValue(undefined);
    const executor = createAIExecutor({
      provider, aiEnabled: true,
      reserveUsage: async () => ({ allowed: true, reservationId: "res-1" }),
      commitUsage, releaseUsage,
      telemetry: { record },
    });

    await expect(executor.generateStructured("user-1", baseInput)).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
    expect(releaseUsage).toHaveBeenCalledWith({ userId: "user-1", reservationId: "res-1" });
    expect(commitUsage).not.toHaveBeenCalled();
    expect(record.mock.calls[0][0]).toMatchObject({ status: "FAILED", errorCode: "AI_PROVIDER_ERROR" });
  });

  it("defaults every port to permissive/no-op so a capability can be wired without the usage/entitlement layers", async () => {
    const result = { data: {}, raw: "{}", model: "m", usage: { inputTokens: null, outputTokens: null }, generationId: null };
    const provider = fakeProvider(result);
    const executor = createAIExecutor({ provider, aiEnabled: true });

    await expect(executor.generateStructured("user-1", baseInput)).resolves.toBe(result);
  });
});
