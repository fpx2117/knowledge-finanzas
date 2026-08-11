import { describe, expect, it, vi } from "vitest";
import { BillingError, createStartTrial, isEligibleForTrial } from "@know-finanzas/billing";

describe("isEligibleForTrial", () => {
  it("is eligible for a brand-new user with no trial, subscription, or promotion history", () => {
    expect(isEligibleForTrial({ trialStartedAt: null, subscriptions: [], everHadPromotionGrant: false })).toBe(true);
  });

  it("is ineligible once a trial was already started", () => {
    expect(isEligibleForTrial({ trialStartedAt: new Date("2026-01-01"), subscriptions: [], everHadPromotionGrant: false })).toBe(false);
  });

  it("is ineligible after ever having a confirmed (non-PENDING) subscription, regardless of its current status", () => {
    for (const status of ["ACTIVE", "PAST_DUE", "PAUSED", "CANCELLED", "EXPIRED"]) {
      expect(isEligibleForTrial({ trialStartedAt: null, subscriptions: [{ status }], everHadPromotionGrant: false })).toBe(false);
    }
  });

  it("is still eligible while the only subscription row is PENDING (an abandoned/never-confirmed checkout)", () => {
    expect(isEligibleForTrial({ trialStartedAt: null, subscriptions: [{ status: "PENDING" }], everHadPromotionGrant: false })).toBe(true);
  });

  it("is ineligible after ever having a promotional grant, of any status", () => {
    expect(isEligibleForTrial({ trialStartedAt: null, subscriptions: [], everHadPromotionGrant: true })).toBe(false);
  });

  it("treats undefined trialStartedAt (a user row with no access-input projection) as never-started", () => {
    expect(isEligibleForTrial({ trialStartedAt: undefined, subscriptions: [], everHadPromotionGrant: false })).toBe(true);
  });
});

function buildDependencies(overrides: Partial<Parameters<typeof createStartTrial>[0]> = {}) {
  const trialStartedAt = new Date("2026-06-01T00:00:00Z");
  const trialEndsAt = new Date("2026-06-15T00:00:00Z");

  const users = overrides.users ?? {
    findAccessInputById: vi.fn().mockResolvedValue({ trialStartedAt: null }),
    startTrialIfNeverStarted: vi.fn().mockResolvedValue({ trialStartedAt, trialEndsAt, wasJustStarted: true }),
  };
  const subscriptions = overrides.subscriptions ?? { listForUser: vi.fn().mockResolvedValue([]) };
  const promotions = overrides.promotions ?? { hasAnyGrantForUser: vi.fn().mockResolvedValue(false) };
  const grantTrialCredits = overrides.grantTrialCredits ?? vi.fn().mockResolvedValue(undefined);

  return {
    users,
    subscriptions,
    promotions,
    grantTrialCredits,
    trialDurationDays: 14,
    now: overrides.now ?? (() => trialStartedAt),
  };
}

describe("createStartTrial", () => {
  it("sets trial dates and grants credits exactly once for an eligible user", async () => {
    const dependencies = buildDependencies();
    const startTrial = createStartTrial(dependencies);

    const result = await startTrial({ userId: "user-1" });

    expect(result.wasJustStarted).toBe(true);
    expect(dependencies.users.startTrialIfNeverStarted).toHaveBeenCalledTimes(1);
    expect(dependencies.grantTrialCredits).toHaveBeenCalledTimes(1);
    expect(dependencies.grantTrialCredits).toHaveBeenCalledWith({ userId: "user-1", trialEndsAt: result.trialEndsAt });
  });

  it("throws BILLING_SUBSCRIPTION_PENDING when a checkout is actively pending, without ever granting credits", async () => {
    const dependencies = buildDependencies({ subscriptions: { listForUser: vi.fn().mockResolvedValue([{ status: "PENDING" }]) } });
    const startTrial = createStartTrial(dependencies);

    await expect(startTrial({ userId: "user-1" })).rejects.toMatchObject({ code: "BILLING_SUBSCRIPTION_PENDING" });
    expect(dependencies.grantTrialCredits).not.toHaveBeenCalled();
  });

  it("throws BILLING_TRIAL_NOT_ELIGIBLE for a user who previously had promotional Pro", async () => {
    const dependencies = buildDependencies({ promotions: { hasAnyGrantForUser: vi.fn().mockResolvedValue(true) } });
    const startTrial = createStartTrial(dependencies);

    await expect(startTrial({ userId: "user-1" })).rejects.toBeInstanceOf(BillingError);
    await expect(startTrial({ userId: "user-1" })).rejects.toMatchObject({ code: "BILLING_TRIAL_NOT_ELIGIBLE" });
    expect(dependencies.grantTrialCredits).not.toHaveBeenCalled();
  });

  it("still grants credits exactly once when a concurrent request already won the atomic UPDATE (idempotency)", async () => {
    const trialStartedAt = new Date("2026-06-01T00:00:00Z");
    const trialEndsAt = new Date("2026-06-15T00:00:00Z");
    const dependencies = buildDependencies({
      users: {
        findAccessInputById: vi.fn().mockResolvedValue({ trialStartedAt: null }),
        startTrialIfNeverStarted: vi.fn().mockResolvedValue({ trialStartedAt, trialEndsAt, wasJustStarted: false }),
      },
    });
    const startTrial = createStartTrial(dependencies);

    const result = await startTrial({ userId: "user-1" });

    expect(result.wasJustStarted).toBe(false);
    // grantTrialCredits is called regardless — it's idempotent per-user on its own (TASK-052),
    // so calling it again for the race loser is safe and produces no second grant.
    expect(dependencies.grantTrialCredits).toHaveBeenCalledTimes(1);
  });
});
