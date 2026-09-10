import {
  resolveProductAccess,
  resolveProductAccessSource,
  type ProductAccessSource,
  type ProductAccessState,
} from "@know-finanzas/billing";
import type { AIUsageSummary } from "@know-finanzas/ai";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type SubscriptionRecord = {
  id: string;
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  planId: string | null;
  createdAt: Date;
};

type PlanRecord = { name: string; price: string; currencyCode: string };
type PaymentRecord = { id: string; status: string; grossAmount: string; currencyCode: string; paidAt: Date | null; createdAt: Date };

type Deps = {
  graceDays: number;
  trialWhatsAppTotal: number;
  proWhatsAppPerPeriod: number;
  users: { findAccessInputById(userId: string): Promise<{ trialEndsAt: Date | null; trialStartedAt?: Date | null } | undefined> };
  subscriptions: {
    findEffectiveForUser(userId: string): Promise<SubscriptionRecord | undefined>;
    listForUser(userId: string): Promise<SubscriptionRecord[]>;
  };
  plans: { findById(planId: string): Promise<PlanRecord | undefined> };
  payments: { listForUser(userId: string): Promise<PaymentRecord[]> };
  ai: (userId: string) => Promise<AIUsageSummary>;
  // Real AI spend (provider USD) for a period — from ai_generation_events. Optional so tests can omit it.
  aiSpend?: (userId: string, range: { from: Date; to: Date }) => Promise<{ costUsd: string; calls: number }>;
  promotions?: { findActiveGrantForUser(userId: string): Promise<{ endsAt: Date } | undefined> };
  now?: () => Date;
};

export type BillingPageView = {
  access: ProductAccessState;
  accessSource: ProductAccessSource;
  trial: { daysRemaining: number; expiresAt: Date } | null;
  subscription: {
    id: string;
    status: SubscriptionRecord["status"];
    plan: PlanRecord | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  payments: PaymentRecord[];
  ai: AIUsageSummary;
  // Real AI spend this period (provider USD) — reference only, never billed to the user.
  aiSpend: { costUsd: string; calls: number } | null;
  promotion: { endsAt: Date } | null;
  whatsappTotal: number;
};

function whatsappTotalFor(state: ProductAccessState, deps: Deps): number {
  if (state === "TRIAL") return deps.trialWhatsAppTotal;
  if (state === "PRO") return deps.proWhatsAppPerPeriod;
  return 0;
}

export function createBillingPageService(deps: Deps) {
  const now = deps.now ?? (() => new Date());

  return {
    async getBillingPage(userId: string): Promise<BillingPageView> {
      const [user, effective, allSubscriptions, payments, activePromotion, ai] = await Promise.all([
        deps.users.findAccessInputById(userId),
        deps.subscriptions.findEffectiveForUser(userId),
        deps.subscriptions.listForUser(userId),
        deps.payments.listForUser(userId),
        deps.promotions?.findActiveGrantForUser(userId) ?? Promise.resolve(undefined),
        deps.ai(userId),
      ]);

      const at = now();

      // Period for the AI-spend figure: the PRO billing period, otherwise the calendar month.
      const periodStart = effective?.currentPeriodStart ?? new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
      const periodEnd = effective?.currentPeriodEnd ?? new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));
      const aiSpend = deps.aiSpend ? await deps.aiSpend(userId, { from: periodStart, to: periodEnd }) : null;

      const resolverInput = {
        now: at,
        trialEndsAt: user?.trialEndsAt ?? null,
        subscription: effective ? { status: effective.status, currentPeriodEnd: effective.currentPeriodEnd } : null,
        activePromotion: activePromotion ? { endsAt: activePromotion.endsAt } : null,
        graceDays: deps.graceDays,
      };
      const access = resolveProductAccess(resolverInput);
      const accessSource = resolveProductAccessSource(resolverInput);

      const trial =
        access === "TRIAL" && user?.trialEndsAt
          ? { daysRemaining: Math.max(0, Math.ceil((user.trialEndsAt.getTime() - at.getTime()) / MS_PER_DAY)), expiresAt: user.trialEndsAt }
          : null;

      // Show the effective subscription, or (for a lapsed/FREE user) the most recently created one
      // so the plan page can still surface "your last plan / renew".
      const subscriptionRecord =
        effective ??
        [...allSubscriptions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
        null;

      const subscription = subscriptionRecord
        ? {
            id: subscriptionRecord.id,
            status: subscriptionRecord.status,
            plan: subscriptionRecord.planId ? (await deps.plans.findById(subscriptionRecord.planId)) ?? null : null,
            currentPeriodEnd: subscriptionRecord.currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionRecord.cancelAtPeriodEnd,
          }
        : null;

      return {
        access,
        accessSource,
        trial,
        subscription,
        payments: [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        ai,
        aiSpend,
        promotion: accessSource === "PROMOTION" && activePromotion ? { endsAt: activePromotion.endsAt } : null,
        whatsappTotal: whatsappTotalFor(access, deps),
      };
    },
  };
}

export type BillingPageService = ReturnType<typeof createBillingPageService>;
