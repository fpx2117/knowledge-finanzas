import type { BillingSubscriptionStatus, EffectiveSubscriptionSnapshot, ProductAccessSource, ProductAccessState } from "../domain/billing-types";
import { isTrialActive } from "./trial-policy";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const GRACE_ELIGIBLE_STATUSES: ReadonlySet<BillingSubscriptionStatus> = new Set(["PAST_DUE"]);

export function isEffectivePaidSubscription(subscription: EffectiveSubscriptionSnapshot | null, now: Date, graceDays: number): boolean {
  if (!subscription) return false;
  if (subscription.status === "ACTIVE") return true;
  if (GRACE_ELIGIBLE_STATUSES.has(subscription.status)) {
    if (!subscription.currentPeriodEnd) return false;
    const graceEnd = new Date(subscription.currentPeriodEnd.getTime() + graceDays * MS_PER_DAY);
    return now <= graceEnd;
  }

  return false;
}

// A promotional grant is never a subscription row — the caller resolves "does this user have an
// active promotional grant" itself (packages/promotions) and only ever hands this resolver the
// grant's `endsAt`, keeping packages/billing free of any dependency on packages/promotions.
function isActivePromotion(activePromotion: { endsAt: Date } | null | undefined, now: Date): boolean {
  return Boolean(activePromotion && activePromotion.endsAt.getTime() > now.getTime());
}

export type ResolveProductAccessInput = {
  now: Date;
  trialEndsAt: Date | null;
  subscription: EffectiveSubscriptionSnapshot | null;
  graceDays: number;
  activePromotion?: { endsAt: Date } | null;
  // @deprecated Since the FREE tier: source === "NONE" now always resolves to "FREE", so this
  // flag no longer changes the outcome. Kept for call-site/back-compat only.
  everHadAccess?: boolean;
  // Hard lock (admin action / future dunning rule): forces EXPIRED_READ_ONLY instead of FREE when
  // no paid/promotion/trial access applies. Defaults to false — a normal lapsed user lands in FREE.
  hardLocked?: boolean;
};

// Priority: PAID_SUBSCRIPTION > PROMOTION > TRIAL > NONE (docs/10.3-promotion-codes-pro-access.md).
// A caller that never passes `activePromotion` (every call site before TASK-053) sees exactly
// the same PAID_SUBSCRIPTION > TRIAL > NONE behavior as before — this is purely additive.
export function resolveProductAccessSource(input: ResolveProductAccessInput): ProductAccessSource {
  if (isEffectivePaidSubscription(input.subscription, input.now, input.graceDays)) return "PAID_SUBSCRIPTION";
  if (isActivePromotion(input.activePromotion, input.now)) return "PROMOTION";
  if (isTrialActive(input.trialEndsAt, input.now)) return "TRIAL";
  return "NONE";
}

export function resolveProductAccess(input: ResolveProductAccessInput): ProductAccessState {
  const source = resolveProductAccessSource(input);
  if (source === "PAID_SUBSCRIPTION" || source === "PROMOTION") return "PRO";
  if (source === "TRIAL") return "TRIAL";
  // source === "NONE": every authenticated user gets the permanent FREE tier, unless explicitly
  // hard-locked (admin / dunning). A lapsed trial now lands here, not in EXPIRED_READ_ONLY.
  return input.hardLocked ? "EXPIRED_READ_ONLY" : "FREE";
}
