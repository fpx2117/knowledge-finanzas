import { resolveProductAccessSource, type ProductAccessSource, type ProductAccessState } from "@know-finanzas/billing";
import type { AIUsageSummary } from "@know-finanzas/ai";

export type PlanRecord = { name: string; price: string; currencyCode: string };
export type SubscriptionRecord = {
  id: string;
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
  providerSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  planId: string;
  createdAt: Date;
};
export type PaymentRecord = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";
  grossAmount: string;
  currencyCode: string;
  paidAt: Date | null;
  createdAt: Date;
};

type UserAccessRepository = { findAccessInputById(userId: string): Promise<{ trialEndsAt: Date | null; trialStartedAt?: Date | null } | undefined> };
type SubscriptionRepository = { findEffectiveForUser(userId: string): Promise<SubscriptionRecord | undefined>; listForUser(userId: string): Promise<SubscriptionRecord[]> };
type PlanRepository = { findById(planId: string): Promise<PlanRecord | undefined> };
type PaymentRepository = { listForUser(userId: string): Promise<PaymentRecord[]> };
// A user has at most one ACTIVE promotional grant (partial unique index in packages/db).
type PromotionRepository = { findActiveGrantForUser(userId: string): Promise<{ endsAt: Date } | undefined> };
type AIUsagePort = (input: { userId: string; access: ProductAccessState; trialEndsAt: Date | null; currentPeriodEnd: Date | null }) => Promise<AIUsageSummary>;

const noPromotions: PromotionRepository = { findActiveGrantForUser: async () => undefined };

export type BillingPageView = {
  access: ProductAccessState;
  accessSource: ProductAccessSource;
  trial: { daysRemaining: number; expiresAt: Date | null } | null;
  // Non-null only when accessSource === "PROMOTION" — never a real Mercado Pago subscription.
  promotion: { endsAt: Date } | null;
  subscription: (SubscriptionRecord & { plan: PlanRecord | undefined }) | null;
  ai: AIUsageSummary;
  whatsappTotal: number;
  payments: PaymentRecord[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Prefers the currently-effective subscription; falls back to the most recently created one so a
// just-cancelled or just-expired subscription still has something to render on the page.
function pickLatestSubscription(effective: SubscriptionRecord | undefined, all: SubscriptionRecord[]): SubscriptionRecord | undefined {
  if (effective) return effective;
  return [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export function createBillingPageService(dependencies: {
  users: UserAccessRepository;
  subscriptions: SubscriptionRepository;
  plans: PlanRepository;
  payments: PaymentRepository;
  // Optional so existing callers/tests that predate TASK-054 keep working unchanged.
  promotions?: PromotionRepository;
  ai: AIUsagePort;
  graceDays: number;
  trialWhatsAppTotal: number;
  proWhatsAppPerPeriod: number;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());
  const promotions = dependencies.promotions ?? noPromotions;

  return {
    async getBillingPage(userId: string): Promise<BillingPageView> {
      const [user, effectiveSubscription, allSubscriptions, payments, activeGrant] = await Promise.all([
        dependencies.users.findAccessInputById(userId),
        dependencies.subscriptions.findEffectiveForUser(userId),
        dependencies.subscriptions.listForUser(userId),
        dependencies.payments.listForUser(userId),
        promotions.findActiveGrantForUser(userId),
      ]);

      const trialEndsAt = user?.trialEndsAt ?? null;
      const accessSource = resolveProductAccessSource({
        now: now(),
        trialEndsAt,
        subscription: effectiveSubscription ? { status: effectiveSubscription.status, currentPeriodEnd: effectiveSubscription.currentPeriodEnd } : null,
        activePromotion: activeGrant ? { endsAt: activeGrant.endsAt } : null,
        graceDays: dependencies.graceDays,
      });
      // In practice a NO_ACCESS user never reaches this page (the routing guard sends them to
      // /elegir-acceso first) — this only guards against showing a misleading "your trial
      // expired" message if that's ever bypassed. `allSubscriptions.length > 0` doesn't count a
      // past-but-now-inactive promotional grant with no trial/subscription ever, an accepted
      // narrow gap for this display-only heuristic.
      const everHadAccess = Boolean(user?.trialStartedAt) || allSubscriptions.length > 0;
      const access: ProductAccessState = accessSource === "PAID_SUBSCRIPTION" || accessSource === "PROMOTION"
        ? "PRO"
        : accessSource === "TRIAL"
          ? "TRIAL"
          : everHadAccess ? "EXPIRED_READ_ONLY" : "NO_ACCESS";

      const latestSubscription = pickLatestSubscription(effectiveSubscription, allSubscriptions);
      const plan = latestSubscription ? await dependencies.plans.findById(latestSubscription.planId) : undefined;
      const ai = await dependencies.ai({ userId, access, trialEndsAt, currentPeriodEnd: effectiveSubscription?.currentPeriodEnd ?? null });

      const trial = access === "TRIAL"
        ? { daysRemaining: trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now().getTime()) / MS_PER_DAY)) : 0, expiresAt: trialEndsAt }
        : null;

      return {
        access,
        accessSource,
        trial,
        promotion: accessSource === "PROMOTION" && activeGrant ? { endsAt: activeGrant.endsAt } : null,
        subscription: latestSubscription ? { ...latestSubscription, plan } : null,
        ai,
        whatsappTotal: access === "PRO" ? dependencies.proWhatsAppPerPeriod : access === "TRIAL" ? dependencies.trialWhatsAppTotal : 0,
        payments: [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      };
    },
  };
}
