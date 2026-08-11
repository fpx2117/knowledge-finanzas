import { assertNoConflictingSubscription, assertPlanActive, BillingError, isBillingError, type BillingProvider, type BillingSubscriptionStatus } from "@know-finanzas/billing";

type PlanRecord = { id: string; code: string; name: string; price: string; currencyCode: string; active: boolean };
type SubscriptionRecord = {
  id: string;
  userId: string;
  planId: string;
  status: BillingSubscriptionStatus;
  providerSubscriptionId: string | null;
};

type PlanRepository = {
  findActiveByCode(code: string): Promise<PlanRecord | undefined>;
};

type SubscriptionRepository = {
  create(input: { userId: string; planId: string; provider: "MERCADO_PAGO"; providerSubscriptionId: string | null; status: BillingSubscriptionStatus; currentPeriodStart: Date | null; currentPeriodEnd: Date | null }): Promise<SubscriptionRecord>;
  findEffectiveForUser(userId: string): Promise<SubscriptionRecord | undefined>;
  attachProviderReference(subscriptionId: string, input: { providerSubscriptionId: string; status: BillingSubscriptionStatus }): Promise<SubscriptionRecord | undefined>;
  markFailed(subscriptionId: string): Promise<SubscriptionRecord | undefined>;
};

export function createBillingService({ plans, subscriptions, provider, backUrl, billingEnabled }: {
  plans: PlanRepository;
  subscriptions: SubscriptionRepository;
  provider: BillingProvider;
  backUrl: string;
  billingEnabled: boolean;
}) {
  return {
    async startSubscription(user: { id: string; email: string }, planCode: string) {
      if (!billingEnabled) throw new BillingError("BILLING_DISABLED");

      const plan = await plans.findActiveByCode(planCode);
      assertPlanActive(plan);

      const existing = await subscriptions.findEffectiveForUser(user.id);
      assertNoConflictingSubscription(existing);

      const local = await subscriptions.create({
        userId: user.id,
        planId: plan.id,
        provider: "MERCADO_PAGO",
        providerSubscriptionId: null,
        status: "PENDING",
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });

      try {
        const result = await provider.createSubscription({
          externalReference: local.id,
          payerEmail: user.email,
          reason: plan.name,
          backUrl,
          amount: plan.price,
          currencyCode: plan.currencyCode,
        });

        await subscriptions.attachProviderReference(local.id, {
          providerSubscriptionId: result.providerSubscriptionId,
          status: result.status,
        });

        return { subscriptionId: local.id, checkoutUrl: result.checkoutUrl, status: result.status };
      } catch (error) {
        // The local-first row never reached the provider successfully; release it so the
        // user can retry without tripping the one-effective-subscription invariant.
        await subscriptions.markFailed(local.id);
        throw isBillingError(error) ? error : new BillingError("BILLING_PROVIDER_ERROR", { cause: error });
      }
    },
  };
}
