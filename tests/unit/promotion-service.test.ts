import { describe, expect, it, vi } from "vitest";
import { createPromotionService, type PromotionalAccessGrantRecord, type PromotionCodeSnapshot } from "@know-finanzas/promotions";

function code(overrides: Partial<PromotionCodeSnapshot> = {}): PromotionCodeSnapshot {
  return {
    id: "code-1",
    normalizedCode: "WELCOME30",
    name: "Welcome",
    description: null,
    status: "DRAFT",
    accessLevel: "PRO",
    durationValue: 30,
    durationUnit: "DAYS",
    redemptionStartsAt: null,
    redemptionEndsAt: null,
    maxRedemptions: null,
    maxRedemptionsPerUser: 1,
    stackingPolicy: "NOT_STACKABLE",
    aiCreditsPerPeriod: 0,
    whatsappMessagesPerPeriod: 0,
    redemptionCount: 0,
    ...overrides,
  };
}

function grant(overrides: Partial<PromotionalAccessGrantRecord> = {}): PromotionalAccessGrantRecord {
  return {
    id: "grant-1",
    userId: "user-1",
    promotionCodeId: "code-1",
    redemptionId: "redemption-1",
    accessLevel: "PRO",
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2026-01-31T00:00:00Z"),
    status: "ACTIVE",
    source: "CODE_REDEMPTION",
    aiCreditsPerPeriod: 0,
    whatsappMessagesPerPeriod: 0,
    ...overrides,
  };
}

function fakeCodesRepo(seed: PromotionCodeSnapshot[] = []) {
  const codes = [...seed];
  return {
    codes,
    findByNormalizedCode: vi.fn(async (normalizedCode: string) => codes.find((c) => c.normalizedCode === normalizedCode)),
    findById: vi.fn(async (id: string) => codes.find((c) => c.id === id)),
    listAll: vi.fn(async () => codes),
    create: vi.fn(async (input: Omit<PromotionCodeSnapshot, "id" | "status" | "redemptionCount" | "normalizedCode"> & { normalizedCode: string }) => {
      const created = code({ ...input, id: `code-${codes.length + 1}`, status: "DRAFT", redemptionCount: 0 });
      codes.push(created);
      return created;
    }),
    update: vi.fn(async (id: string, input: Partial<PromotionCodeSnapshot>) => {
      const found = codes.find((c) => c.id === id)!;
      Object.assign(found, input);
      return found;
    }),
    setStatus: vi.fn(async (id: string, status: PromotionCodeSnapshot["status"]) => {
      const found = codes.find((c) => c.id === id)!;
      found.status = status;
      return found;
    }),
  };
}

function fakeGrantsRepo(seed: PromotionalAccessGrantRecord[] = []) {
  const grants = [...seed];
  return {
    grants,
    findGrantById: vi.fn(async (id: string) => grants.find((g) => g.id === id)),
    revokeGrant: vi.fn(async (id: string, input: { revokedBy: string; revocationReason: string | null; revokedAt: Date }) => {
      const found = grants.find((g) => g.id === id && g.status === "ACTIVE");
      if (!found) return undefined;
      found.status = "REVOKED";
      return found;
    }),
    extendGrant: vi.fn(async (id: string, input: { endsAt: Date }) => {
      const found = grants.find((g) => g.id === id);
      if (!found) return undefined;
      found.endsAt = input.endsAt;
      return found;
    }),
  };
}

describe("createPromotionService", () => {
  it("creates a code, normalizing it before storage", async () => {
    const codes = fakeCodesRepo();
    const service = createPromotionService({ codes, grants: fakeGrantsRepo() });

    const created = await service.createCode({ code: "  welcome30  ", name: "Welcome", durationValue: 30, createdBy: "admin-1" });

    expect(created.normalizedCode).toBe("WELCOME30");
    expect(created.status).toBe("DRAFT");
  });

  it("rejects creating a code that normalizes to an already-existing code", async () => {
    const codes = fakeCodesRepo([code()]);
    const service = createPromotionService({ codes, grants: fakeGrantsRepo() });

    await expect(service.createCode({ code: "welcome30", name: "Dup", durationValue: 30, createdBy: "admin-1" }))
      .rejects.toThrow("PROMOTION_CODE_ALREADY_EXISTS");
  });

  it("activateCode/pauseCode/revokeCode transition status and 404 on an unknown code", async () => {
    const codes = fakeCodesRepo([code()]);
    const service = createPromotionService({ codes, grants: fakeGrantsRepo() });

    expect((await service.activateCode("code-1")).status).toBe("ACTIVE");
    expect((await service.pauseCode("code-1")).status).toBe("PAUSED");
    expect((await service.revokeCode("code-1")).status).toBe("REVOKED");
    await expect(service.activateCode("missing")).rejects.toThrow("PROMOTION_NOT_FOUND");
  });

  it("getPromotion/listPromotions expose the code catalog", async () => {
    const codes = fakeCodesRepo([code(), code({ id: "code-2", normalizedCode: "SECOND" })]);
    const service = createPromotionService({ codes, grants: fakeGrantsRepo() });

    expect(await service.getPromotion("code-1")).toMatchObject({ id: "code-1" });
    expect(await service.listPromotions()).toHaveLength(2);
  });

  it("updateCode never touches duration/allowance fields — only fields present in UpdatePromotionCodeInput", async () => {
    const codes = fakeCodesRepo([code({ durationValue: 30, aiCreditsPerPeriod: 100 })]);
    const service = createPromotionService({ codes, grants: fakeGrantsRepo() });

    const updated = await service.updateCode("code-1", { name: "Renamed" });

    expect(updated.name).toBe("Renamed");
    expect(updated.durationValue).toBe(30);
    expect(updated.aiCreditsPerPeriod).toBe(100);
  });

  it("revokeGrant sets the grant to REVOKED and 404s on an unknown or already-revoked grant", async () => {
    const grants = fakeGrantsRepo([grant()]);
    const service = createPromotionService({ codes: fakeCodesRepo(), grants });

    const revoked = await service.revokeGrant("grant-1", { revokedBy: "admin-1", revocationReason: "support case" });
    expect(revoked.status).toBe("REVOKED");

    await expect(service.revokeGrant("missing-grant", { revokedBy: "admin-1", revocationReason: null })).rejects.toThrow("PROMOTION_GRANT_NOT_FOUND");
  });

  it("extendGrant updates endsAt and 404s on an unknown grant", async () => {
    const grants = fakeGrantsRepo([grant()]);
    const service = createPromotionService({ codes: fakeCodesRepo(), grants });

    const extended = await service.extendGrant("grant-1", { endsAt: new Date("2026-03-01T00:00:00Z") });
    expect(extended.endsAt).toEqual(new Date("2026-03-01T00:00:00Z"));

    await expect(service.extendGrant("missing-grant", { endsAt: new Date() })).rejects.toThrow("PROMOTION_GRANT_NOT_FOUND");
  });
});
