import { describe, expect, it, vi } from "vitest";
import {
  createRedeemPromotionCode,
  type PromotionalAccessGrantRecord,
  type PromotionAccessPeriodRecord,
  type PromotionRedemptionRecord,
  type RedeemCodeOutcome,
  type RedeemPromotionCodeRepository,
} from "@know-finanzas/promotions";

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

const redemption: PromotionRedemptionRecord = { id: "redemption-1", promotionCodeId: "code-1", userId: "user-1", status: "REDEEMED", redeemedAt: new Date("2026-01-01T00:00:00Z"), grantId: "grant-1" };
const period: PromotionAccessPeriodRecord = { id: "period-1", grantId: "grant-1", sequence: 1, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-31T00:00:00Z"), status: "ACTIVE" };

function fakeRepository(outcome: RedeemCodeOutcome): RedeemPromotionCodeRepository {
  return { redeemCode: vi.fn(async () => outcome) };
}

describe("createRedeemPromotionCode", () => {
  it("normalizes the code before calling the repository", async () => {
    const repository = fakeRepository({ outcome: "redeemed", redemption, grant: grant(), periods: [period] });
    const redeemPromotionCode = createRedeemPromotionCode({ repository });

    await redeemPromotionCode({ rawCode: "  welcome30  ", userId: "user-1", hasActivePaidSubscription: false });

    expect(repository.redeemCode).toHaveBeenCalledWith(expect.objectContaining({ normalizedCode: "WELCOME30", userId: "user-1" }));
  });

  it("rejects an active paid subscriber before ever calling the repository", async () => {
    const repository = fakeRepository({ outcome: "redeemed", redemption, grant: grant(), periods: [period] });
    const redeemPromotionCode = createRedeemPromotionCode({ repository });

    await expect(redeemPromotionCode({ rawCode: "WELCOME30", userId: "user-1", hasActivePaidSubscription: true }))
      .rejects.toThrow("PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION");
    expect(repository.redeemCode).not.toHaveBeenCalled();
  });

  it("maps a not_found outcome to the generic PROMOTION_INVALID error (never reveals code existence)", async () => {
    const repository = fakeRepository({ outcome: "not_found" });
    const redeemPromotionCode = createRedeemPromotionCode({ repository });

    await expect(redeemPromotionCode({ rawCode: "UNKNOWNCODE", userId: "user-1", hasActivePaidSubscription: false }))
      .rejects.toThrow("PROMOTION_INVALID");
  });

  it("propagates a rejected outcome's specific reason", async () => {
    const repository = fakeRepository({ outcome: "rejected", reason: "PROMOTION_ALREADY_ACTIVE" });
    const redeemPromotionCode = createRedeemPromotionCode({ repository });

    await expect(redeemPromotionCode({ rawCode: "WELCOME30", userId: "user-1", hasActivePaidSubscription: false }))
      .rejects.toThrow("PROMOTION_ALREADY_ACTIVE");
  });

  it("checks every rate-limit key and rejects on the first exhausted one, without calling the repository", async () => {
    const repository = fakeRepository({ outcome: "redeemed", redemption, grant: grant(), periods: [period] });
    const checkRateLimit = vi.fn(async (key: string) => key !== "ip:1.2.3.4");
    const redeemPromotionCode = createRedeemPromotionCode({ repository, checkRateLimit });

    await expect(redeemPromotionCode({ rawCode: "WELCOME30", userId: "user-1", hasActivePaidSubscription: false, rateLimitKeys: ["user:user-1", "ip:1.2.3.4"] }))
      .rejects.toThrow("PROMOTION_REDEMPTION_RATE_LIMITED");
    expect(repository.redeemCode).not.toHaveBeenCalled();
  });

  it("grants AI credits and WhatsApp allowance once per usage period, only when configured above zero", async () => {
    const periods: PromotionAccessPeriodRecord[] = [
      { id: "period-1", grantId: "grant-1", sequence: 1, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-31T00:00:00Z"), status: "ACTIVE" },
      { id: "period-2", grantId: "grant-1", sequence: 2, startsAt: new Date("2026-01-31T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z"), status: "ACTIVE" },
    ];
    const repository = fakeRepository({ outcome: "redeemed", redemption, grant: grant({ aiCreditsPerPeriod: 50, whatsappMessagesPerPeriod: 0 }), periods });
    const grantAiCredits = vi.fn(async () => {});
    const grantNotificationAllowance = vi.fn(async () => {});
    const redeemPromotionCode = createRedeemPromotionCode({ repository, grantAiCredits, grantNotificationAllowance });

    await redeemPromotionCode({ rawCode: "WELCOME30", userId: "user-1", hasActivePaidSubscription: false });

    expect(grantAiCredits).toHaveBeenCalledTimes(2);
    expect(grantAiCredits).toHaveBeenCalledWith(expect.objectContaining({ periodId: "period-1", amount: 50 }));
    expect(grantAiCredits).toHaveBeenCalledWith(expect.objectContaining({ periodId: "period-2", amount: 50 }));
    expect(grantNotificationAllowance).not.toHaveBeenCalled();
  });

  it("works with no ports configured (defaults to safe no-ops)", async () => {
    const repository = fakeRepository({ outcome: "redeemed", redemption, grant: grant({ aiCreditsPerPeriod: 10, whatsappMessagesPerPeriod: 5 }), periods: [period] });
    const redeemPromotionCode = createRedeemPromotionCode({ repository });

    const result = await redeemPromotionCode({ rawCode: "WELCOME30", userId: "user-1", hasActivePaidSubscription: false });

    expect(result.grant.id).toBe("grant-1");
  });
});
