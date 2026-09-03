import { describe, expect, it, vi } from "vitest";
import { createGetAdminCommercialUserSummary } from "../../apps/web/src/features/admin/users/services/get-admin-commercial-user-summary";

const now = new Date("2026-06-15T00:00:00Z");
const baseUser = { id: "user-1", name: "User One", email: "user1@example.test", trialStartedAt: null, trialEndsAt: null, createdAt: new Date("2026-01-01T00:00:00Z") };

function buildDeps(overrides: Partial<{
  user: typeof baseUser | undefined;
  subscription: { id: string; status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED"; currentPeriodEnd: Date | null; planId: string } | undefined;
  payments: Array<{ id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED"; grossAmount: string; currencyCode: string; paidAt: Date | null; createdAt: Date }>;
  refund: { id: string; status: "PENDING" | "APPROVED" | "FAILED"; amount: string; reason: string } | undefined;
  grant: { id: string; endsAt: Date; source: string } | undefined;
}> = {}) {
  const payments = overrides.payments ?? [];
  const user = "user" in overrides ? overrides.user : baseUser;
  return {
    users: { findById: vi.fn(async () => user) },
    subscriptions: { findEffectiveForUser: vi.fn(async () => overrides.subscription) },
    payments: { listForUser: vi.fn(async () => payments) },
    refunds: { findLatestForPayment: vi.fn(async () => overrides.refund) },
    promotions: { findActiveGrantForUser: vi.fn(async () => overrides.grant) },
    aiCredits: { getAvailableBalances: vi.fn(async () => ({ TRIAL_ALLOWANCE: 10, PLAN_ALLOWANCE: 0, PURCHASED: 0 })) },
    whatsappUsage: { countSentWhatsAppSince: vi.fn(async () => 3) },
    graceDays: 3,
    now: () => now,
  };
}

describe("createGetAdminCommercialUserSummary", () => {
  it("throws ADMIN_TARGET_USER_NOT_FOUND for an unknown user", async () => {
    const summary = createGetAdminCommercialUserSummary(buildDeps({ user: undefined }));
    await expect(summary("missing")).rejects.toThrow("ADMIN_TARGET_USER_NOT_FOUND");
  });

  it("resolves TRIAL access and reports the why-access breakdown accordingly", async () => {
    const deps = buildDeps({ user: { ...baseUser, trialStartedAt: new Date("2026-06-01T00:00:00Z"), trialEndsAt: new Date("2026-07-01T00:00:00Z") } });
    const summary = createGetAdminCommercialUserSummary(deps);

    const result = await summary("user-1");

    expect(result.access).toEqual({ paidSubscriptionEffective: false, promotionEffective: false, trialActive: true, resolvedState: "TRIAL", source: "TRIAL" });
    expect(result.subscription).toBeNull();
    expect(result.promotion).toBeNull();
  });

  it("resolves PRO/PROMOTION for an active promotional grant with no subscription", async () => {
    const deps = buildDeps({ grant: { id: "grant-1", endsAt: new Date("2026-07-01T00:00:00Z"), source: "ADMIN_OVERRIDE" } });
    const summary = createGetAdminCommercialUserSummary(deps);

    const result = await summary("user-1");

    expect(result.access).toMatchObject({ paidSubscriptionEffective: false, promotionEffective: true, resolvedState: "PRO", source: "PROMOTION" });
    expect(result.promotion).toEqual({ grantId: "grant-1", endsAt: new Date("2026-07-01T00:00:00Z"), source: "ADMIN_OVERRIDE" });
  });

  it("prioritizes an effective paid subscription in the breakdown even with an active grant present", async () => {
    const deps = buildDeps({
      subscription: { id: "sub-1", status: "ACTIVE", currentPeriodEnd: new Date("2026-07-01T00:00:00Z"), planId: "plan-1" },
      grant: { id: "grant-1", endsAt: new Date("2026-08-01T00:00:00Z"), source: "CODE_REDEMPTION" },
    });
    const summary = createGetAdminCommercialUserSummary(deps);

    const result = await summary("user-1");

    expect(result.access.source).toBe("PAID_SUBSCRIPTION");
    expect(result.subscription).toMatchObject({ id: "sub-1", status: "ACTIVE" });
  });

  it("picks the most recent payment as latestPayment and looks up its refund", async () => {
    const older = { id: "pay-1", status: "APPROVED" as const, grossAmount: "7.99", currencyCode: "USD", paidAt: null, createdAt: new Date("2026-01-01T00:00:00Z") };
    const newer = { id: "pay-2", status: "APPROVED" as const, grossAmount: "7.99", currencyCode: "USD", paidAt: null, createdAt: new Date("2026-06-01T00:00:00Z") };
     const deps = buildDeps({ payments: [older, newer], refund: { id: "refund-1", status: "APPROVED", amount: "7.99", currencyCode: "USD", reason: "DUPLICATE_CHARGE" } });
    const summary = createGetAdminCommercialUserSummary(deps);

    const result = await summary("user-1");

    expect(result.latestPayment?.id).toBe("pay-2");
    expect(deps.refunds.findLatestForPayment).toHaveBeenCalledWith("pay-2");
     expect(result.latestRefund).toEqual({ id: "refund-1", status: "APPROVED", amount: "7.99", currencyCode: "USD", reason: "DUPLICATE_CHARGE" });
  });

  it("reports null latestPayment/latestRefund with no payment history, without calling the refund repository", async () => {
    const deps = buildDeps({ payments: [] });
    const summary = createGetAdminCommercialUserSummary(deps);

    const result = await summary("user-1");

    expect(result.latestPayment).toBeNull();
    expect(result.latestRefund).toBeNull();
    expect(deps.refunds.findLatestForPayment).not.toHaveBeenCalled();
  });

  it("never calls anything beyond the injected local repositories (no external provider client exists to call)", async () => {
    const deps = buildDeps();
    const summary = createGetAdminCommercialUserSummary(deps);

    await summary("user-1");

    expect(deps.users.findById).toHaveBeenCalledTimes(1);
    expect(deps.subscriptions.findEffectiveForUser).toHaveBeenCalledTimes(1);
    expect(deps.aiCredits.getAvailableBalances).toHaveBeenCalledTimes(1);
    expect(deps.whatsappUsage.countSentWhatsAppSince).toHaveBeenCalledTimes(1);
  });
});
