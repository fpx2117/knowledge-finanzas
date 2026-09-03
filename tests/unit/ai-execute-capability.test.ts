import { describe, expect, it, vi } from "vitest";
import { createExecuteAICapability, type AICreditService } from "@know-finanzas/ai";

function fakeCreditService(overrides: Partial<AICreditService> = {}): AICreditService {
  return {
    getAvailableBalances: vi.fn(),
    reserve: vi.fn().mockResolvedValue({ reservation: { id: "res-1", status: "PENDING" }, cost: 1 }),
    commit: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AICreditService;
}

describe("executeAICapability", () => {
  it("runs the full order and commits on success", async () => {
    const creditService = fakeCreditService();
    const resolveAccess = vi.fn().mockResolvedValue("TRIAL");
    const execute = vi.fn().mockResolvedValue({ ok: true });
    const executeAICapability = createExecuteAICapability({ aiEnabled: true, creditService, resolveAccess });

    const result = await executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute });

    expect(result).toEqual({ ok: true });
    expect(resolveAccess).toHaveBeenCalledWith("user-1");
    expect(creditService.reserve).toHaveBeenCalledWith({ userId: "user-1", access: "TRIAL", capability: "transaction.categorize", operationId: "op-1" });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(creditService.commit).toHaveBeenCalledWith("res-1");
    expect(creditService.release).not.toHaveBeenCalled();
  });

  it("throws AI_DISABLED and never resolves access when the kill switch is off", async () => {
    const creditService = fakeCreditService();
    const resolveAccess = vi.fn();
    const executeAICapability = createExecuteAICapability({ aiEnabled: false, creditService, resolveAccess });

    await expect(executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute: vi.fn() }))
      .rejects.toMatchObject({ code: "AI_DISABLED" });
    expect(resolveAccess).not.toHaveBeenCalled();
  });

  it("throws AI_ACCESS_REQUIRED for EXPIRED_READ_ONLY without ever reserving or executing", async () => {
    const creditService = fakeCreditService();
    const execute = vi.fn();
    const executeAICapability = createExecuteAICapability({ aiEnabled: true, creditService, resolveAccess: async () => "EXPIRED_READ_ONLY" });

    await expect(executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute }))
      .rejects.toMatchObject({ code: "AI_ACCESS_REQUIRED" });
    expect(creditService.reserve).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("throws AI_ENTITLEMENT_REQUIRED when the capability is not entitled for this access state", async () => {
    const creditService = fakeCreditService();
    const executeAICapability = createExecuteAICapability({
      aiEnabled: true,
      creditService,
      resolveAccess: async () => "TRIAL",
      checkCapabilityEntitlement: async () => false,
    });

    await expect(executeAICapability({ userId: "user-1", capability: "import.map", operationId: "op-1", execute: vi.fn() }))
      .rejects.toMatchObject({ code: "AI_ENTITLEMENT_REQUIRED" });
    expect(creditService.reserve).not.toHaveBeenCalled();
  });

  it("throws AI_USAGE_RATE_LIMITED when the rate limiter denies the request", async () => {
    const creditService = fakeCreditService();
    const executeAICapability = createExecuteAICapability({
      aiEnabled: true,
      creditService,
      resolveAccess: async () => "TRIAL",
      checkRateLimit: async () => false,
    });

    await expect(executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute: vi.fn() }))
      .rejects.toMatchObject({ code: "AI_USAGE_RATE_LIMITED" });
    expect(creditService.reserve).not.toHaveBeenCalled();
  });

  it("releases the reservation and rethrows when execute() fails, without committing", async () => {
    const creditService = fakeCreditService();
    const execute = vi.fn().mockRejectedValue(new Error("provider exploded"));
    const executeAICapability = createExecuteAICapability({ aiEnabled: true, creditService, resolveAccess: async () => "TRIAL" });

    await expect(executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute }))
      .rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
    expect(creditService.release).toHaveBeenCalledWith("res-1");
    expect(creditService.commit).not.toHaveBeenCalled();
  });

  it("rechaza una operación ya finalizada sin volver a ejecutar el proveedor", async () => {
    const creditService = fakeCreditService({
      reserve: vi.fn().mockResolvedValue({
        reservation: { id: "res-1", status: "COMMITTED" },
        cost: 1,
      }),
    });
    const execute = vi.fn();
    const executeAICapability = createExecuteAICapability({
      aiEnabled: true,
      creditService,
      resolveAccess: async () => "TRIAL",
    });

    await expect(executeAICapability({
      userId: "user-1",
      capability: "capture.parse",
      operationId: "op-repeated",
      execute,
    })).rejects.toMatchObject({ code: "AI_CREDIT_OPERATION_DUPLICATE" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("records usage telemetry on both success and failure without leaking prompt/output content", async () => {
    const creditService = fakeCreditService();
    const record = vi.fn().mockResolvedValue(undefined);
    const executeAICapability = createExecuteAICapability({
      aiEnabled: true,
      creditService,
      resolveAccess: async () => "TRIAL",
      telemetry: { record },
    });

    await executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-1", execute: async () => "result" });
    expect(record.mock.calls[0][0]).toMatchObject({ userId: "user-1", capability: "transaction.categorize", status: "SUCCESS", credits: 1 });

    await expect(executeAICapability({ userId: "user-1", capability: "transaction.categorize", operationId: "op-2", execute: async () => { throw new Error("boom"); } }))
      .rejects.toThrow();
    expect(record.mock.calls[1][0]).toMatchObject({ status: "FAILED" });
  });
});
