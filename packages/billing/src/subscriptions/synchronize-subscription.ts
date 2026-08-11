import { BillingError } from "../errors";
import type { BillingSubscriptionStatus } from "../domain/billing-types";
import type { PaymentSnapshot, SubscriptionSnapshot } from "../providers/billing-provider";
import { noopGrantProPeriodCredits, noopStartProWhatsAppAllowance, type GrantProPeriodCreditsPort, type StartProWhatsAppAllowancePort } from "./ports";

export type SubscriptionRecord = {
  id: string;
  userId: string;
  planId: string;
  status: BillingSubscriptionStatus;
  providerSubscriptionId: string | null;
};

export type BillingPeriodRecord = {
  id: string;
  subscriptionId: string;
  startsAt: Date;
  endsAt: Date;
};

export type SubscriptionRepository = {
  findById(id: string): Promise<SubscriptionRecord | undefined>;
  findByProviderSubscriptionId(providerSubscriptionId: string): Promise<SubscriptionRecord | undefined>;
  updateStatusAndPeriod(id: string, input: { status: BillingSubscriptionStatus; providerSubscriptionId: string; currentPeriodStart: Date | null; currentPeriodEnd: Date | null }): Promise<SubscriptionRecord | undefined>;
};

export type PeriodRepository = {
  upsertPeriod(input: { subscriptionId: string; startsAt: Date; endsAt: Date; status: "PENDING" | "ACTIVE" | "CLOSED" | "FAILED"; providerReference: string | null }): Promise<{ period: BillingPeriodRecord; created: boolean }>;
  listForSubscription(subscriptionId: string): Promise<BillingPeriodRecord[]>;
};

export type PaymentRepository = {
  upsertByProviderPaymentId(input: {
    userId: string;
    subscriptionId: string;
    billingPeriodId: string | null;
    providerPaymentId: string;
    status: PaymentSnapshot["status"];
    grossAmount: string;
    currencyCode: string;
    providerFee: string | null;
    netAmount: string | null;
    paidAt: Date | null;
  }): Promise<unknown>;
};

export function createSubscriptionSynchronizer(dependencies: {
  subscriptions: SubscriptionRepository;
  periods: PeriodRepository;
  payments: PaymentRepository;
  grantProPeriodCredits?: GrantProPeriodCreditsPort;
  startProWhatsAppAllowance?: StartProWhatsAppAllowancePort;
}) {
  const grantCredits = dependencies.grantProPeriodCredits ?? noopGrantProPeriodCredits;
  const startAllowance = dependencies.startProWhatsAppAllowance ?? noopStartProWhatsAppAllowance;

  async function resolveSubscription(providerSubscriptionId: string, externalReference: string | null) {
    const byProviderId = await dependencies.subscriptions.findByProviderSubscriptionId(providerSubscriptionId);
    if (byProviderId) return byProviderId;

    // Local-first pattern: the very first webhook for a subscription may arrive before the
    // provider reference was attached locally (e.g. a crash right after the provider call).
    if (externalReference) return dependencies.subscriptions.findById(externalReference);
    return undefined;
  }

  return {
    async synchronizeSubscription(snapshot: SubscriptionSnapshot) {
      const local = await resolveSubscription(snapshot.providerSubscriptionId, snapshot.externalReference);
      if (!local) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");

      const updated = await dependencies.subscriptions.updateStatusAndPeriod(local.id, {
        status: snapshot.status,
        providerSubscriptionId: snapshot.providerSubscriptionId,
        currentPeriodStart: snapshot.currentPeriodStart,
        currentPeriodEnd: snapshot.currentPeriodEnd,
      });
      if (!updated) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");

      if (updated.status !== "ACTIVE" || !snapshot.currentPeriodStart || !snapshot.currentPeriodEnd) {
        return { subscription: updated, period: null, periodCreated: false };
      }

      const { period, created } = await dependencies.periods.upsertPeriod({
        subscriptionId: updated.id,
        startsAt: snapshot.currentPeriodStart,
        endsAt: snapshot.currentPeriodEnd,
        status: "ACTIVE",
        providerReference: snapshot.providerSubscriptionId,
      });

      if (created) {
        const grantInput = { userId: updated.userId, subscriptionId: updated.id, billingPeriodId: period.id, periodStart: snapshot.currentPeriodStart, periodEnd: snapshot.currentPeriodEnd };
        await grantCredits(grantInput);
        await startAllowance(grantInput);
      }

      return { subscription: updated, period, periodCreated: created };
    },

    async synchronizePayment(snapshot: PaymentSnapshot) {
      if (!snapshot.externalReference) throw new BillingError("BILLING_RECONCILIATION_FAILED", { field: "externalReference" });

      const subscription = (await dependencies.subscriptions.findById(snapshot.externalReference))
        ?? (await dependencies.subscriptions.findByProviderSubscriptionId(snapshot.externalReference));
      if (!subscription) throw new BillingError("BILLING_SUBSCRIPTION_NOT_FOUND");

      const periods = await dependencies.periods.listForSubscription(subscription.id);
      const matchingPeriod = snapshot.paidAt
        ? periods.find((period) => snapshot.paidAt! >= period.startsAt && snapshot.paidAt! < period.endsAt)
        : undefined;

      const payment = await dependencies.payments.upsertByProviderPaymentId({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        billingPeriodId: matchingPeriod?.id ?? null,
        providerPaymentId: snapshot.providerPaymentId,
        status: snapshot.status,
        grossAmount: snapshot.grossAmount,
        currencyCode: snapshot.currencyCode,
        providerFee: snapshot.providerFee,
        netAmount: snapshot.netAmount,
        paidAt: snapshot.paidAt,
      });

      return { payment, subscriptionId: subscription.id };
    },
  };
}
