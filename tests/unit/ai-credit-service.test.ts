import { describe, expect, it, vi } from "vitest";
import { createAICreditService, isAIError, type AICreditRepositoryPort, type AICreditReservationRecord } from "@know-finanzas/ai";

function fakeRepo(overrides: Partial<AICreditRepositoryPort> = {}): AICreditRepositoryPort {
  return {
    grantTrialCredits: vi.fn(),
    grantPlanCredits: vi.fn(),
    getAvailableBalances: vi.fn().mockResolvedValue({ TRIAL_ALLOWANCE: 0, PLAN_ALLOWANCE: 0, PURCHASED: 0 }),
    findByOperationId: vi.fn().mockResolvedValue(undefined),
    reserve: vi.fn(),
    commit: vi.fn(),
    release: vi.fn(),
    listStalePending: vi.fn(),
    markExpired: vi.fn(),
    ...overrides,
  } as unknown as AICreditRepositoryPort;
}

function reservationFixture(overrides: Partial<AICreditReservationRecord> = {}): AICreditReservationRecord {
  return {
    id: "res-1",
    userId: "user-1",
    capability: "transaction.categorize",
    pool: "TRIAL_ALLOWANCE",
    credits: 1,
    operationId: "op-1",
    status: "PENDING",
    expiresAt: new Date(),
    creditEntryId: null,
    ...overrides,
  };
}

describe("AICreditService.reserve", () => {
  it("reserves against the first pool in the access-state's order that has enough balance", async () => {
    const reservation = reservationFixture({ pool: "PURCHASED" });
    const reserve = vi.fn()
      .mockResolvedValueOnce({ allowed: false, available: 0 }) // PLAN_ALLOWANCE denied
      .mockResolvedValueOnce({ allowed: true, reservation }); // PURCHASED succeeds
    const repo = fakeRepo({ reserve });

    const service = createAICreditService(repo);
    const result = await service.reserve({ userId: "user-1", access: "PRO", capability: "transaction.categorize", operationId: "op-1" });

    expect(reserve).toHaveBeenCalledTimes(2);
    expect(reserve.mock.calls[0][0]).toMatchObject({ pool: "PLAN_ALLOWANCE" });
    expect(reserve.mock.calls[1][0]).toMatchObject({ pool: "PURCHASED" });
    expect(result.reservation).toBe(reservation);
    expect(result.cost).toBe(1);
  });

  it("throws AI_CREDITS_EXHAUSTED when no pool in the order has enough balance", async () => {
    const repo = fakeRepo({ reserve: vi.fn().mockResolvedValue({ allowed: false, available: 0 }) });
    const service = createAICreditService(repo);

    await expect(service.reserve({ userId: "user-1", access: "PRO", capability: "transaction.categorize", operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_CREDITS_EXHAUSTED" });
  });

  it("throws AI_ACCESS_REQUIRED when the access state has no usable pool", async () => {
    const repo = fakeRepo();
    const service = createAICreditService(repo);

    await expect(service.reserve({ userId: "user-1", access: "EXPIRED_READ_ONLY", capability: "transaction.categorize", operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_ACCESS_REQUIRED" });
    expect(repo.reserve).not.toHaveBeenCalled();
  });

  it("is idempotent: a repeated operationId with the same capability returns the existing reservation without reserving again", async () => {
    const existing = reservationFixture();
    const repo = fakeRepo({ findByOperationId: vi.fn().mockResolvedValue(existing) });
    const service = createAICreditService(repo);

    const result = await service.reserve({ userId: "user-1", access: "TRIAL", capability: "transaction.categorize", operationId: "op-1" });

    expect(result.reservation).toBe(existing);
    expect(repo.reserve).not.toHaveBeenCalled();
  });

  it("throws AI_CREDIT_OPERATION_DUPLICATE when the same operationId is reused for a different capability", async () => {
    const existing = reservationFixture({ capability: "assistant.query.complex", credits: 4 });
    const repo = fakeRepo({ findByOperationId: vi.fn().mockResolvedValue(existing) });
    const service = createAICreditService(repo);

    await expect(service.reserve({ userId: "user-1", access: "TRIAL", capability: "transaction.categorize", operationId: "op-1" }))
      .rejects.toMatchObject({ code: "AI_CREDIT_OPERATION_DUPLICATE" });
  });
});

describe("AICreditService.commit / release", () => {
  it("commit throws AI_CREDIT_RESERVATION_FAILED when the reservation does not exist", async () => {
    const repo = fakeRepo({ commit: vi.fn().mockResolvedValue(undefined) });
    const service = createAICreditService(repo);

    await expect(service.commit("missing")).rejects.toSatisfy((error) => isAIError(error) && error.code === "AI_CREDIT_RESERVATION_FAILED");
  });

  it("release throws AI_CREDIT_RESERVATION_FAILED when the reservation does not exist", async () => {
    const repo = fakeRepo({ release: vi.fn().mockResolvedValue(undefined) });
    const service = createAICreditService(repo);

    await expect(service.release("missing")).rejects.toSatisfy((error) => isAIError(error) && error.code === "AI_CREDIT_RESERVATION_FAILED");
  });
});
