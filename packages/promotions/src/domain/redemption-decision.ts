import type { PromotionErrorCode } from "../errors";
import { computePromotionUsagePeriods, type UsagePeriodBoundary } from "./compute-usage-periods";
import type { PromotionCodeSnapshot } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RedeemDecisionContext = {
  code: PromotionCodeSnapshot;
  userRedemptionCount: number;
  hasActiveGrant: boolean;
};

export type RedeemDecision =
  | { ok: true; startsAt: Date; endsAt: Date; periods: UsagePeriodBoundary[] }
  | { ok: false; reason: PromotionErrorCode };

// Pure state-machine check: status/window/limit/stacking. Called from inside the DB
// repository's atomic transaction (the code row is locked and the counts it's given are read
// within that same transaction) so this function itself has no I/O and stays trivially unit
// testable, while still being the single source of truth exercised on the real redemption path
// — no separate/duplicated inline copy of these rules exists anywhere else.
export function decideRedemption(context: RedeemDecisionContext, now: Date): RedeemDecision {
  const { code } = context;

  if (code.status !== "ACTIVE") return { ok: false, reason: "PROMOTION_NOT_ACTIVE" };
  if (code.redemptionStartsAt && now.getTime() < code.redemptionStartsAt.getTime()) return { ok: false, reason: "PROMOTION_NOT_STARTED" };
  if (code.redemptionEndsAt && now.getTime() > code.redemptionEndsAt.getTime()) return { ok: false, reason: "PROMOTION_EXPIRED" };
  if (code.maxRedemptions !== null && code.redemptionCount >= code.maxRedemptions) return { ok: false, reason: "PROMOTION_REDEMPTION_LIMIT_REACHED" };
  if (context.userRedemptionCount >= code.maxRedemptionsPerUser) {
    return { ok: false, reason: code.maxRedemptionsPerUser === 1 ? "PROMOTION_ALREADY_REDEEMED" : "PROMOTION_USER_LIMIT_REACHED" };
  }
  // V1: only NOT_STACKABLE exists, so any active grant blocks a new redemption outright.
  if (context.hasActiveGrant) {
    return { ok: false, reason: code.stackingPolicy === "NOT_STACKABLE" ? "PROMOTION_ALREADY_ACTIVE" : "PROMOTION_NOT_STACKABLE" };
  }

  const startsAt = now;
  const endsAt = new Date(startsAt.getTime() + code.durationValue * MS_PER_DAY);
  const periods = computePromotionUsagePeriods({ startsAt, endsAt });
  return { ok: true, startsAt, endsAt, periods };
}
