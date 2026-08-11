import { describe, expect, it, vi } from "vitest";
import { createGrantPromotionalProAccess, type GrantPromotionalProAccessRepository, type PromotionalAccessGrantRecord, type PromotionAccessPeriodRecord } from "@know-finanzas/promotions";

const grant: PromotionalAccessGrantRecord = {
  id: "grant-1",
  userId: "user-1",
  promotionCodeId: null,
  redemptionId: null,
  accessLevel: "PRO",
  startsAt: new Date("2026-01-01T00:00:00Z"),
  endsAt: new Date("2026-01-31T00:00:00Z"),
  status: "ACTIVE",
  source: "ADMIN_OVERRIDE",
  aiCreditsPerPeriod: 20,
  whatsappMessagesPerPeriod: 0,
};

const period: PromotionAccessPeriodRecord = { id: "period-1", grantId: "grant-1", sequence: 1, startsAt: grant.startsAt, endsAt: grant.endsAt, status: "ACTIVE" };

describe("createGrantPromotionalProAccess", () => {
  it("precomputes usage periods and passes them to the repository", async () => {
    const createManualGrant = vi.fn(async () => ({ grant, periods: [period] }));
    const repository: GrantPromotionalProAccessRepository = { createManualGrant };
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository });

    await grantPromotionalProAccess({ userId: "user-1", source: "ADMIN_OVERRIDE", startsAt: grant.startsAt, endsAt: grant.endsAt, aiCreditsPerPeriod: 20 });

    expect(createManualGrant).toHaveBeenCalledWith(expect.objectContaining({ periods: expect.arrayContaining([expect.objectContaining({ sequence: 1 })]) }));
  });

  it("never touches promotion_codes/promotion_redemptions — only calls createManualGrant", async () => {
    const createManualGrant = vi.fn(async () => ({ grant, periods: [period] }));
    const repository: GrantPromotionalProAccessRepository = { createManualGrant };
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository });

    const result = await grantPromotionalProAccess({ userId: "user-1", source: "MANUAL_PROMOTION", startsAt: grant.startsAt, endsAt: grant.endsAt });

    expect(createManualGrant).toHaveBeenCalledTimes(1);
    expect("grant" in result && result.grant.id).toBe("grant-1");
  });

  it("propagates an alreadyActive rejection without calling any port", async () => {
    const createManualGrant = vi.fn(async () => ({ alreadyActive: true as const }));
    const grantAiCredits = vi.fn(async () => {});
    const repository: GrantPromotionalProAccessRepository = { createManualGrant };
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository, grantAiCredits });

    const result = await grantPromotionalProAccess({ userId: "user-1", source: "ADMIN_OVERRIDE", startsAt: grant.startsAt, endsAt: grant.endsAt, aiCreditsPerPeriod: 20 });

    expect(result).toEqual({ alreadyActive: true });
    expect(grantAiCredits).not.toHaveBeenCalled();
  });

  it("grants AI credits per period only when aiCreditsPerPeriod > 0", async () => {
    const createManualGrant = vi.fn(async () => ({ grant, periods: [period] }));
    const grantAiCredits = vi.fn(async () => {});
    const grantNotificationAllowance = vi.fn(async () => {});
    const repository: GrantPromotionalProAccessRepository = { createManualGrant };
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository, grantAiCredits, grantNotificationAllowance });

    await grantPromotionalProAccess({ userId: "user-1", source: "ADMIN_OVERRIDE", startsAt: grant.startsAt, endsAt: grant.endsAt, aiCreditsPerPeriod: 20 });

    expect(grantAiCredits).toHaveBeenCalledWith(expect.objectContaining({ periodId: "period-1", amount: 20 }));
    expect(grantNotificationAllowance).not.toHaveBeenCalled();
  });
});
