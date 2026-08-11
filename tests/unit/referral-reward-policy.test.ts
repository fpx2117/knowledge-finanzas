import { describe, expect, it } from "vitest";
import { cappedPromotionalDays, DEFAULT_REFERRAL_REWARD_POLICY, isRewardCapReached, resolveRewardForReferrer } from "@know-finanzas/referrals";

describe("resolveRewardForReferrer", () => {
  it("grants promotional pro days to a non-paid referrer", () => {
    const reward = resolveRewardForReferrer(DEFAULT_REFERRAL_REWARD_POLICY, { referrerHasEffectivePaidAccess: false });
    expect(reward).toEqual({ type: "PROMOTIONAL_PRO_DAYS", value: 30 });
  });

  it("grants AI credits to a paid referrer", () => {
    const reward = resolveRewardForReferrer(DEFAULT_REFERRAL_REWARD_POLICY, { referrerHasEffectivePaidAccess: true });
    expect(reward).toEqual({ type: "AI_CREDITS", value: 100 });
  });
});

describe("isRewardCapReached", () => {
  it("is not reached below the per-period cap", () => {
    expect(isRewardCapReached(DEFAULT_REFERRAL_REWARD_POLICY, { rewardsGrantedInPeriod: 2 })).toBe(false);
  });

  it("is reached at the per-period cap", () => {
    expect(isRewardCapReached(DEFAULT_REFERRAL_REWARD_POLICY, { rewardsGrantedInPeriod: 3 })).toBe(true);
  });

  it("is reached above the per-period cap", () => {
    expect(isRewardCapReached(DEFAULT_REFERRAL_REWARD_POLICY, { rewardsGrantedInPeriod: 4 })).toBe(true);
  });
});

describe("cappedPromotionalDays", () => {
  it("returns the requested days when well under the cap", () => {
    expect(cappedPromotionalDays(DEFAULT_REFERRAL_REWARD_POLICY, { requestedDays: 30, alreadyBankedDaysAhead: 0 })).toBe(30);
  });

  it("caps the requested days at the remaining capacity", () => {
    expect(cappedPromotionalDays(DEFAULT_REFERRAL_REWARD_POLICY, { requestedDays: 30, alreadyBankedDaysAhead: 80 })).toBe(10);
  });

  it("returns 0 once the cap is already exhausted", () => {
    expect(cappedPromotionalDays(DEFAULT_REFERRAL_REWARD_POLICY, { requestedDays: 30, alreadyBankedDaysAhead: 90 })).toBe(0);
  });

  it("returns 0 when already past the cap", () => {
    expect(cappedPromotionalDays(DEFAULT_REFERRAL_REWARD_POLICY, { requestedDays: 30, alreadyBankedDaysAhead: 120 })).toBe(0);
  });
});
