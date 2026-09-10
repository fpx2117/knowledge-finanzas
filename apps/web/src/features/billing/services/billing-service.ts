import { BillingError, PRO_MONTHLY_PLAN_CODE, type BillingSubscriptionStatus } from "@know-finanzas/billing";

// Structural ports — kept local so this service depends only on shapes, not on @know-finanzas/db
// or a concrete provider (matches every other feature service in apps/web).
type PlanRecord = { id: string; code: string; name: string; price: string; currencyCode: string; active: boolean };

type PlansPort = {
  findActiveByCode(code: string): Promise<PlanRecord | undefined>;
};

type SubscriptionRecord = { id: string; userId: string; planId: string; status: string; providerSubscriptionId: string | null };

type SubscriptionsPort = {
  create(input: { userId: string; planId: string; status: "PENDING" }): Promise<SubscriptionRecord>;
  findEffectiveForUser(userId: string): Promise<SubscriptionRecord | undefined>;
  attachProviderReference(id: string, input: { providerSubscriptionId: string; status: "PENDING" | "ACTIVE" }): Promise<SubscriptionRecord | undefined>;
  markFailed(id: string): Promise<SubscriptionRecord | undefined>;
};

type ProviderPort = {
  createSubscription(input: {
    externalReference: string;
    payerEmail: string;
    reason: string;
    backUrl: string;
    amount: string;
    currencyCode: string;
  }): Promise<{ providerSubscriptionId: string; status: BillingSubscriptionStatus; checkoutUrl: string }>;
};

export type StartSubscriptionResult = { subscriptionId: string; checkoutUrl: string; status: "PENDING" };

// Local-first checkout start (contract proven by tests/unit/billing-service.test.ts):
// 1. guard billing-enabled + plan-active + no existing effective subscription
// 2. create a local PENDING row and use its id as the provider's externalReference
// 3. on provider success, attach the provider reference; on failure, mark the local row failed so
//    it never looks effective and the user can retry.
export function createBillingService(dependencies: {
  plans: PlansPort;
  subscriptions: SubscriptionsPort;
  provider: ProviderPort;
  backUrl: string;
  billingEnabled: boolean;
}) {
  return {
    async startSubscription(user: { id: string; email: string }, planCode: string = PRO_MONTHLY_PLAN_CODE): Promise<StartSubscriptionResult> {
      if (!dependencies.billingEnabled) throw new BillingError("BILLING_DISABLED");

      const plan = await dependencies.plans.findActiveByCode(planCode);
      if (!plan) throw new BillingError("BILLING_PLAN_NOT_FOUND");

      const existing = await dependencies.subscriptions.findEffectiveForUser(user.id);
      if (existing) throw new BillingError("BILLING_SUBSCRIPTION_ALREADY_ACTIVE");

      const local = await dependencies.subscriptions.create({ userId: user.id, planId: plan.id, status: "PENDING" });

      let providerResult;
      try {
        providerResult = await dependencies.provider.createSubscription({
          externalReference: local.id,
          payerEmail: user.email,
          reason: plan.name,
          backUrl: dependencies.backUrl,
          amount: plan.price,
          currencyCode: plan.currencyCode,
        });
      } catch (error) {
        await dependencies.subscriptions.markFailed(local.id);
        throw new BillingError("BILLING_PROVIDER_ERROR", { cause: error });
      }

      await dependencies.subscriptions.attachProviderReference(local.id, {
        providerSubscriptionId: providerResult.providerSubscriptionId,
        status: "PENDING",
      });

      return { subscriptionId: local.id, checkoutUrl: providerResult.checkoutUrl, status: "PENDING" };
    },
  };
}

export type BillingService = ReturnType<typeof createBillingService>;
