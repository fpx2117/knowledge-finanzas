import type { NotificationIntent } from "../domain/types";

const ENDING_THRESHOLDS = new Set([7, 3, 1]);

export type PromotionGrantInput = { id: string; endsAt: Date };

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// Mirrors the TRIAL_ENDING/TRIAL_EXPIRED reminder pattern already used for the trial countdown
// (apps/web/src/features/notifications/services/evaluate-financial-alerts.ts) — pure, so it's
// unit-testable without a database, and dedup relies entirely on the intent's dedupKey (safe to
// re-evaluate on every dashboard visit; each threshold only ever produces one stored
// notification per grant). Copy/category is always ACCOUNT, never BILLING — a promotional grant
// is never a paid subscription (task's Domain Rules: never labeled as a subscription/billing event).
export function evaluatePromotionExpiry(input: { grant: PromotionGrantInput; now: Date }): Array<Omit<NotificationIntent, "userId">> {
  const daysRemaining = Math.floor((input.grant.endsAt.getTime() - input.now.getTime()) / (24 * 60 * 60 * 1000));

  if (ENDING_THRESHOLDS.has(daysRemaining)) {
    return [{
      type: "PROMOTION_ENDING",
      category: "ACCOUNT",
      priority: "NORMAL",
      titleKey: "PROMOTION_ENDING",
      bodyKey: "PROMOTION_ENDING",
      metadata: { daysRemaining, endsAt: isoDate(input.grant.endsAt) },
      occurredAt: input.now,
      dedupKey: `PROMOTION_ENDING:${input.grant.id}:${daysRemaining}`,
    }];
  }

  if (daysRemaining <= 0) {
    return [{
      type: "PROMOTION_EXPIRED",
      category: "ACCOUNT",
      priority: "NORMAL",
      titleKey: "PROMOTION_EXPIRED",
      bodyKey: "PROMOTION_EXPIRED",
      occurredAt: input.now,
      dedupKey: `PROMOTION_EXPIRED:${input.grant.id}`,
    }];
  }

  return [];
}

// Fired once, right after a successful redemption (not from the recurring evaluation loop —
// there's no "re-evaluate on every visit" concern here, it only ever needs to happen once).
export function buildPromotionStartedIntent(input: { grant: PromotionGrantInput; now: Date }): Omit<NotificationIntent, "userId"> {
  return {
    type: "PROMOTION_STARTED",
    category: "ACCOUNT",
    priority: "NORMAL",
    titleKey: "PROMOTION_STARTED",
    bodyKey: "PROMOTION_STARTED",
    metadata: { endsAt: isoDate(input.grant.endsAt) },
    occurredAt: input.now,
    dedupKey: `PROMOTION_STARTED:${input.grant.id}`,
  };
}
