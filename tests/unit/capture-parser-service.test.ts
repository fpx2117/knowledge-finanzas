import { describe, expect, it, vi } from "vitest";

import { createCaptureParserService } from "../../apps/web/src/features/capture/services/capture-parser-service";

function aiDraft(overrides: Record<string, unknown> = {}) {
  return {
    type: "EXPENSE" as const,
    amount: "50000.00",
    description: "Supermercado",
    merchantText: "Carrefour",
    institutionText: null,
    confidence: 0.92,
    ambiguities: [],
    ...overrides,
  };
}

describe("capture parser fallback policy", () => {
  it("no consume IA para texto vacío", async () => {
    const executeAI = vi.fn();
    const service = createCaptureParserService({ executeAI, parseWithAI: vi.fn(), createOperationId: () => "op-1" });

    const result = await service.parse("user-1", "   ");

    expect(result.source).toBe("DETERMINISTIC");
    expect(executeAI).not.toHaveBeenCalled();
  });

  it("no consume IA cuando el parser determinístico tiene alta confianza", async () => {
    const executeAI = vi.fn();
    const service = createCaptureParserService({ executeAI, parseWithAI: vi.fn(), createOperationId: () => "op-1" });

    const result = await service.parse("user-1", "gasté 14k en nafta con Galicia");

    expect(result.source).toBe("DETERMINISTIC");
    expect(executeAI).not.toHaveBeenCalled();
  });

  it("usa capture.parse para una frase de baja confianza", async () => {
    const parseWithAI = vi.fn().mockResolvedValue(aiDraft());
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({ executeAI, parseWithAI, createOperationId: () => "op-1" });

    const result = await service.parse("user-1", "50000 Carrefour");

    expect(result.source).toBe("AI");
    expect(result.draft).toMatchObject({ amount: "50000.00", merchantText: "Carrefour" });
    expect(executeAI).toHaveBeenCalledWith(expect.objectContaining({
      userId: "user-1",
      capability: "capture.parse",
      operationId: "op-1",
    }));
  });

  it("reutiliza el operation id provisto por el cliente para el mismo intento", async () => {
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({
      executeAI,
      parseWithAI: vi.fn().mockResolvedValue(aiDraft()),
      createOperationId: () => "server-op",
    });

    await service.parse("user-1", "50000 Carrefour", "client-op");

    expect(executeAI).toHaveBeenCalledWith(expect.objectContaining({ operationId: "client-op" }));
  });

  it("preserva un monto determinístico frente a una salida distinta del modelo", async () => {
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({
      executeAI,
      parseWithAI: vi.fn().mockResolvedValue(aiDraft({ amount: "999999.00" })),
      createOperationId: () => "op-1",
    });

    const result = await service.parse("user-1", "50000 Carrefour");

    expect(result.draft.amount).toBe("50000.00");
  });

  it("vuelve al resultado local si créditos, entitlement o proveedor fallan", async () => {
    const executeAI = vi.fn().mockRejectedValue(new Error("AI_CREDITS_EXHAUSTED"));
    const service = createCaptureParserService({ executeAI, parseWithAI: vi.fn(), createOperationId: () => "op-1" });

    const result = await service.parse("user-1", "50000 Carrefour");

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.draft.amount).toBe("50000.00");
  });

  it("descarta dentro de la ejecución una respuesta que no mejora la confianza", async () => {
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({
      executeAI,
      parseWithAI: vi.fn().mockResolvedValue(aiDraft({ confidence: 0.7 })),
      createOperationId: () => "op-1",
    });

    const result = await service.parse("user-1", "50000 Carrefour");

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.draft.ambiguities).toContain("No pude mejorar la frase con IA; revisá los datos.");
  });

  it("no cobra una respuesta con mayor confianza que no aporta ningún dato", async () => {
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({
      executeAI,
      parseWithAI: vi.fn().mockResolvedValue({
        type: "EXPENSE",
        amount: "50000.00",
        description: "Carrefour",
        merchantText: null,
        institutionText: null,
        confidence: 0.99,
        ambiguities: ["Asumí que es un gasto."],
      }),
      createOperationId: () => "op-1",
    });

    const result = await service.parse("user-1", "50000 Carrefour");

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.draft.ambiguities).toContain("No pude mejorar la frase con IA; revisá los datos.");
  });

  it("no cobra una transferencia detectada solo por IA mientras el flujo no admita prefill", async () => {
    const executeAI = vi.fn().mockImplementation(({ execute }) => execute());
    const service = createCaptureParserService({
      executeAI,
      parseWithAI: vi.fn().mockResolvedValue(aiDraft({ type: "TRANSFER" })),
      createOperationId: () => "op-1",
    });

    const result = await service.parse("user-1", "50000 para mi billetera");

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.draft.ambiguities).toContain("No pude mejorar la frase con IA; revisá los datos.");
  });

  it("no consume IA para transferencias hasta poder trasladar el prefill al flujo específico", async () => {
    const executeAI = vi.fn();
    const service = createCaptureParserService({ executeAI, parseWithAI: vi.fn(), createOperationId: () => "op-1" });

    const result = await service.parse("user-1", "transferí a mercado pago");

    expect(result.draft.type).toBe("TRANSFER");
    expect(executeAI).not.toHaveBeenCalled();
  });

  it("no envía textos excesivos al proveedor", async () => {
    const executeAI = vi.fn();
    const service = createCaptureParserService({ executeAI, parseWithAI: vi.fn(), createOperationId: () => "op-1" });

    const result = await service.parse("user-1", `50000 ${"x".repeat(241)}`);

    expect(result.source).toBe("DETERMINISTIC");
    expect(result.draft.ambiguities).toContain("La frase es demasiado larga para mejorarla con IA.");
    expect(executeAI).not.toHaveBeenCalled();
  });
});
