import { computePromotionUsagePeriods } from "../domain/compute-usage-periods";
import type { PromotionalAccessGrantRecord, PromotionAccessPeriodRecord } from "../domain/types";
import { noopAiCreditGrant, noopNotificationAllowance, type AiCreditGrantPort, type NotificationAllowancePort } from "./ports";

export type GrantPromotionalProAccessRepository = {
  // Admin-only entry point, reused by TASK-060's commercial admin operations — never touches
  // promotion_codes/promotion_redemptions, only creates a grant + its usage periods directly.
  createManualGrant(input: {
    userId: string;
    source: "ADMIN_OVERRIDE" | "MANUAL_PROMOTION" | "REFERRAL_REWARD";
    startsAt: Date;
    endsAt: Date;
    aiCreditsPerPeriod: number;
    whatsappMessagesPerPeriod: number;
    periods: Array<{ sequence: number; startsAt: Date; endsAt: Date }>;
  }): Promise<{ grant: PromotionalAccessGrantRecord; periods: PromotionAccessPeriodRecord[] } | { alreadyActive: true }>;
};

export function createGrantPromotionalProAccess(dependencies: {
  repository: GrantPromotionalProAccessRepository;
  grantAiCredits?: AiCreditGrantPort;
  grantNotificationAllowance?: NotificationAllowancePort;
}) {
  const grantAiCredits = dependencies.grantAiCredits ?? noopAiCreditGrant;
  const grantNotificationAllowance = dependencies.grantNotificationAllowance ?? noopNotificationAllowance;

  return async function grantPromotionalProAccess(input: {
    userId: string;
    source: "ADMIN_OVERRIDE" | "MANUAL_PROMOTION" | "REFERRAL_REWARD";
    startsAt: Date;
    endsAt: Date;
    aiCreditsPerPeriod?: number;
    whatsappMessagesPerPeriod?: number;
  }) {
    const result = await dependencies.repository.createManualGrant({
      userId: input.userId,
      source: input.source,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      aiCreditsPerPeriod: input.aiCreditsPerPeriod ?? 0,
      whatsappMessagesPerPeriod: input.whatsappMessagesPerPeriod ?? 0,
      periods: computePromotionUsagePeriods({ startsAt: input.startsAt, endsAt: input.endsAt }),
    });

    if ("alreadyActive" in result) return result;

    for (const period of result.periods) {
      if (result.grant.aiCreditsPerPeriod > 0) {
        await grantAiCredits({ userId: input.userId, grantId: result.grant.id, periodId: period.id, amount: result.grant.aiCreditsPerPeriod, periodStart: period.startsAt, periodEnd: period.endsAt });
      }
      if (result.grant.whatsappMessagesPerPeriod > 0) {
        await grantNotificationAllowance({ userId: input.userId, grantId: result.grant.id, periodId: period.id, whatsappMessagesPerPeriod: result.grant.whatsappMessagesPerPeriod, periodStart: period.startsAt, periodEnd: period.endsAt });
      }
    }

    return { grant: result.grant, periods: result.periods };
  };
}
