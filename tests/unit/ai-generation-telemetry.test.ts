import { describe, expect, it, vi } from "vitest";
import type { AIProvider, GenerateStructuredResult } from "@know-finanzas/ai";
import { createTelemetryProvider, runWithGenerationContext, getGenerationContext } from "@know-finanzas/ai";
import { z } from "zod";

const schema = z.object({ ok: z.boolean() });

function fakeResult(): GenerateStructuredResult<{ ok: boolean }> {
  return {
    data: { ok: true },
    raw: '{"ok":true}',
    model: "openai/gpt-4o-mini",
    usage: { inputTokens: 120, outputTokens: 15, cachedInputTokens: 40, costUsd: 0.00012 },
    generationId: "gen-1",
  };
}

const input = { role: "FAST" as const, capability: "assistant.query.simple", promptVersion: "v1", prompt: "hi", schema, schemaName: "s" };

describe("generation telemetry provider", () => {
  it("records real token usage + provider USD cost with the caller context, on success", async () => {
    const inner: AIProvider = { generateStructured: vi.fn().mockResolvedValue(fakeResult()) };
    const record = vi.fn().mockResolvedValue(undefined);
    const provider = createTelemetryProvider(inner, { record });

    await runWithGenerationContext(
      { userId: "u1", capability: "assistant.query.simple", operationId: "op1", creditsCharged: 2 },
      () => provider.generateStructured(input),
    );

    expect(record).toHaveBeenCalledTimes(1);
    expect(record.mock.calls[0][0]).toMatchObject({
      userId: "u1",
      operationId: "op1",
      creditsCharged: 2,
      capability: "assistant.query.simple",
      resolvedModel: "openai/gpt-4o-mini",
      status: "SUCCESS",
      inputTokens: 120,
      outputTokens: 15,
      cachedInputTokens: 40,
      costUsd: 0.00012,
      generationId: "gen-1",
    });
  });

  it("records a FAILED event and still rethrows the original error", async () => {
    const boom = new Error("provider down");
    const inner: AIProvider = { generateStructured: vi.fn().mockRejectedValue(boom) };
    const record = vi.fn().mockResolvedValue(undefined);
    const provider = createTelemetryProvider(inner, { record });

    await expect(
      runWithGenerationContext({ userId: "u1", capability: "c", operationId: "op", creditsCharged: 4 }, () =>
        provider.generateStructured(input),
      ),
    ).rejects.toThrow("provider down");

    expect(record.mock.calls[0][0]).toMatchObject({ status: "FAILED", userId: "u1", costUsd: null, inputTokens: null });
  });

  it("swallows a recorder failure — the generation result is unaffected", async () => {
    const inner: AIProvider = { generateStructured: vi.fn().mockResolvedValue(fakeResult()) };
    const provider = createTelemetryProvider(inner, { record: vi.fn().mockRejectedValue(new Error("db down")) });

    const result = await provider.generateStructured(input);
    expect(result.data).toEqual({ ok: true });
  });

  it("records with null identity fields when there is no caller context", async () => {
    const inner: AIProvider = { generateStructured: vi.fn().mockResolvedValue(fakeResult()) };
    const record = vi.fn().mockResolvedValue(undefined);
    const provider = createTelemetryProvider(inner, { record });

    await provider.generateStructured(input);

    expect(record.mock.calls[0][0]).toMatchObject({ userId: null, operationId: null, creditsCharged: null });
    expect(getGenerationContext()).toBeUndefined();
  });
});
