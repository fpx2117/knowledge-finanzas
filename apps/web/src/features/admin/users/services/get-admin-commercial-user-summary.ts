import { isEffectivePaidSubscription, isTrialActive, resolveProductAccess, resolveProductAccessSource, type ProductAccessSource, type ProductAccessState } from "@know-finanzas/billing";
import { ApplicationError } from "@know-finanzas/shared";

type UserRow = { id: string; name: string; email: string; trialStartedAt: Date | null; trialEndsAt: Date | null; createdAt: Date } | undefined;
type SubscriptionRow = { id: string; status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED"; currentPeriodEnd: Date | null; planId: string } | undefined;
type PaymentRow = { id: string; status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED"; grossAmount: string; currencyCode: string; paidAt: Date | null; createdAt: Date };
type RefundRow = { id: string; status: "PENDING" | "APPROVED" | "FAILED"; amount: string; reason: string } | undefined;
type PromotionGrantRow = { id: string; endsAt: Date; source: string } | undefined;

export type AdminUserRepository = { findById(userId: string): Promise<UserRow> };
export type AdminSubscriptionRepository = { findEffectiveForUser(userId: string): Promise<SubscriptionRow> };
export type AdminPaymentRepository = { listForUser(userId: string): Promise<PaymentRow[]> };
export type AdminRefundRepository = { findLatestForPayment(paymentId: string): Promise<RefundRow> };
export type AdminPromotionRepository = { findActiveGrantForUser(userId: string): Promise<PromotionGrantRow> };
export type AdminAiCreditRepository = { getAvailableBalances(userId: string): Promise<Record<string, number>> };
export type AdminWhatsAppUsageRepository = { countSentWhatsAppSince(userId: string, since: Date): Promise<number> };

export type WhyAccessBreakdown = {
  paidSubscriptionEffective: boolean;
  promotionEffective: boolean;
  trialActive: boolean;
  resolvedState: ProductAccessState;
  source: ProductAccessSource;
};

export type AdminCommercialUserSummary = {
  user: { id: string; name: string; email: string; createdAt: Date };
  access: WhyAccessBreakdown;
  trial: { startedAt: Date | null; endsAt: Date | null } | null;
  subscription: { id: string; status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED"; currentPeriodEnd: Date | null } | null;
  promotion: { grantId: string; endsAt: Date; source: string } | null;
  aiCreditBalances: Record<string, number>;
  whatsappMessagesLast30Days: number;
  latestPayment: PaymentRow | null;
  latestRefund: { id: string; status: "PENDING" | "APPROVED" | "FAILED"; amount: string; reason: string } | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createGetAdminCommercialUserSummary(dependencies: {
  users: AdminUserRepository;
  subscriptions: AdminSubscriptionRepository;
  payments: AdminPaymentRepository;
  refunds: AdminRefundRepository;
  promotions: AdminPromotionRepository;
  aiCredits: AdminAiCreditRepository;
  whatsappUsage: AdminWhatsAppUsageRepository;
  graceDays: number;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());

  // Pure composition over existing tables (Implementation Notes) — never calls Mercado Pago,
  // OpenRouter, or Twilio; every field here is read from local Postgres data already collected
  // by other domain services.
  return async function getAdminCommercialUserSummary(userId: string): Promise<AdminCommercialUserSummary> {
    const user = await dependencies.users.findById(userId);
    if (!user) throw new ApplicationError("ADMIN_TARGET_USER_NOT_FOUND");

    const [subscription, payments, activeGrant, aiCreditBalances, whatsappMessagesLast30Days] = await Promise.all([
      dependencies.subscriptions.findEffectiveForUser(userId),
      dependencies.payments.listForUser(userId),
      dependencies.promotions.findActiveGrantForUser(userId),
      dependencies.aiCredits.getAvailableBalances(userId),
      dependencies.whatsappUsage.countSentWhatsAppSince(userId, new Date(now().getTime() - 30 * MS_PER_DAY)),
    ]);

    const latestPayment = [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
    const latestRefund = latestPayment ? (await dependencies.refunds.findLatestForPayment(latestPayment.id)) ?? null : null;

    const currentTime = now();
    const paidSubscriptionEffective = isEffectivePaidSubscription(subscription ? { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null, currentTime, dependencies.graceDays);
    const trialActive = isTrialActive(user.trialEndsAt, currentTime);
    const promotionEffective = Boolean(activeGrant && activeGrant.endsAt.getTime() > currentTime.getTime());

    const accessInput = {
      now: currentTime,
      trialEndsAt: user.trialEndsAt,
      subscription: subscription ? { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null,
      activePromotion: activeGrant ? { endsAt: activeGrant.endsAt } : null,
      graceDays: dependencies.graceDays,
    };

    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      access: {
        paidSubscriptionEffective,
        promotionEffective,
        trialActive,
        resolvedState: resolveProductAccess(accessInput),
        source: resolveProductAccessSource(accessInput),
      },
      trial: user.trialStartedAt || user.trialEndsAt ? { startedAt: user.trialStartedAt, endsAt: user.trialEndsAt } : null,
      subscription: subscription ? { id: subscription.id, status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null,
      promotion: activeGrant ? { grantId: activeGrant.id, endsAt: activeGrant.endsAt, source: activeGrant.source } : null,
      aiCreditBalances,
      whatsappMessagesLast30Days,
      latestPayment,
      latestRefund: latestRefund ? { id: latestRefund.id, status: latestRefund.status, amount: latestRefund.amount, reason: latestRefund.reason } : null,
    };
  };
}
