import {
  createAIGenerationEventRepository,
  createBillingPaymentRepository,
  createBillingPlanRepository,
  createBillingSubscriptionRepository,
  createPromotionRepository,
  createUserRepository,
  db,
} from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

import { getAIUsageSummary } from "@/lib/billing/ai-usage-summary.instance";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";
import { createBillingPageService } from "./billing-page-service";

const users = createUserRepository(db);
const subscriptions = createBillingSubscriptionRepository(db);
const plans = createBillingPlanRepository(db);
const payments = createBillingPaymentRepository(db);
const promotions = createPromotionRepository(db);
const aiGenerationEvents = createAIGenerationEventRepository(db);

export const billingPageService = createBillingPageService({
  graceDays: env.BILLING_GRACE_PERIOD_DAYS,
  trialWhatsAppTotal: env.TRIAL_WHATSAPP_TOTAL,
  proWhatsAppPerPeriod: env.PRO_WHATSAPP_PER_PERIOD,
  users,
  subscriptions,
  plans,
  payments,
  promotions,
  aiSpend: async (userId, range) => {
    const totals = await aiGenerationEvents.sumForUser(userId, range);
    return { costUsd: totals.costUsd, calls: totals.calls };
  },
  ai: async (userId) => {
    const [access, user, effective] = await Promise.all([
      productAccessGate.getAccessState(userId),
      users.findAccessInputById(userId),
      subscriptions.findEffectiveForUser(userId),
    ]);
    return getAIUsageSummary({
      userId,
      access,
      trialEndsAt: user?.trialEndsAt ?? null,
      currentPeriodEnd: effective?.currentPeriodEnd ?? null,
    });
  },
});
