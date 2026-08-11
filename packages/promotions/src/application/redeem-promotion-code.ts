import { PromotionError, type PromotionErrorCode } from "../errors";
import { normalizePromotionCode } from "../domain/normalize-code";
import { decideRedemption, type RedeemDecision, type RedeemDecisionContext } from "../domain/redemption-decision";
import type { PromotionAccessPeriodRecord, PromotionalAccessGrantRecord, PromotionRedemptionRecord } from "../domain/types";
import { noopAiCreditGrant, noopNotificationAllowance, type AiCreditGrantPort, type NotificationAllowancePort } from "./ports";

export type RedeemCodeOutcome =
  | { outcome: "not_found" }
  // `reason` is a plain string, not PromotionErrorCode, at this repository boundary: the
  // concrete implementation (packages/db) has no dependency on @know-finanzas/promotions's
  // types, so it can only promise "whatever string `decide` gave back" — narrowed to
  // PromotionErrorCode by the caller (see below) which knows `decide` only ever returns one.
  | { outcome: "rejected"; reason: string }
  | { outcome: "redeemed"; redemption: PromotionRedemptionRecord; grant: PromotionalAccessGrantRecord; periods: PromotionAccessPeriodRecord[] };

export type RedeemPromotionCodeRepository = {
  // Runs entirely inside one DB transaction: locks the promotion_codes row (SELECT ... FOR
  // UPDATE), reads the caller's existing redemption count for this code and whether they already
  // hold an ACTIVE grant, calls `decide` with that snapshot, and — only if `decide` returns
  // ok:true — inserts the redemption/grant/period rows and increments the code's redemption
  // counter, all before releasing the lock. This is what makes max_redemptions/max_redemptions_
  // per_user/stacking enforcement atomic under concurrency (task's Financial Invariants).
  redeemCode(input: {
    normalizedCode: string;
    userId: string;
    decide: (context: RedeemDecisionContext) => RedeemDecision;
  }): Promise<RedeemCodeOutcome>;
};

// Rate limiting is intentionally generic (a bare "is this key still allowed" check) so the
// caller decides what keys to check — typically one for the user and one for the request IP —
// without this package needing to know about HTTP/session concerns.
export type RedeemRateLimiter = (key: string) => Promise<boolean>;

export function createRedeemPromotionCode(dependencies: {
  repository: RedeemPromotionCodeRepository;
  checkRateLimit?: RedeemRateLimiter;
  grantAiCredits?: AiCreditGrantPort;
  grantNotificationAllowance?: NotificationAllowancePort;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());
  const grantAiCredits = dependencies.grantAiCredits ?? noopAiCreditGrant;
  const grantNotificationAllowance = dependencies.grantNotificationAllowance ?? noopNotificationAllowance;

  return async function redeemPromotionCode(input: {
    rawCode: string;
    userId: string;
    // Cross-context precondition, resolved by the caller from @know-finanzas/billing
    // (ProductAccessGate/isEffectivePaidSubscription) rather than imported here — keeps
    // packages/promotions decoupled from packages/billing, matching how other bounded contexts
    // in this codebase only ever talk to each other through explicit inputs/ports.
    hasActivePaidSubscription: boolean;
    rateLimitKeys?: string[];
  }): Promise<{ redemption: PromotionRedemptionRecord; grant: PromotionalAccessGrantRecord; periods: PromotionAccessPeriodRecord[] }> {
    for (const key of input.rateLimitKeys ?? []) {
      const allowed = dependencies.checkRateLimit ? await dependencies.checkRateLimit(key) : true;
      if (!allowed) throw new PromotionError("PROMOTION_REDEMPTION_RATE_LIMITED");
    }

    const normalizedCode = normalizePromotionCode(input.rawCode);

    if (input.hasActivePaidSubscription) throw new PromotionError("PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION");

    const currentTime = now();
    const result = await dependencies.repository.redeemCode({
      normalizedCode,
      userId: input.userId,
      decide: (context) => decideRedemption(context, currentTime),
    });

    if (result.outcome === "not_found") {
      // Generic error, same as an inactive/expired code (task's Security Requirements: never
      // reveal code existence).
      throw new PromotionError("PROMOTION_INVALID");
    }
    // Safe: the only implementation of RedeemPromotionCodeRepository (packages/db) only ever
    // forwards a reason produced by the `decide` callback we passed in above, which always
    // returns a real PromotionErrorCode.
    if (result.outcome === "rejected") throw new PromotionError(result.reason as PromotionErrorCode);

    for (const period of result.periods) {
      if (result.grant.aiCreditsPerPeriod > 0) {
        await grantAiCredits({ userId: input.userId, grantId: result.grant.id, periodId: period.id, amount: result.grant.aiCreditsPerPeriod, periodStart: period.startsAt, periodEnd: period.endsAt });
      }
      if (result.grant.whatsappMessagesPerPeriod > 0) {
        await grantNotificationAllowance({ userId: input.userId, grantId: result.grant.id, periodId: period.id, whatsappMessagesPerPeriod: result.grant.whatsappMessagesPerPeriod, periodStart: period.startsAt, periodEnd: period.endsAt });
      }
    }

    return { redemption: result.redemption, grant: result.grant, periods: result.periods };
  };
}
