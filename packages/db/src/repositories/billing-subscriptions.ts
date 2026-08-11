import { and, eq, inArray, lt } from "drizzle-orm";

import type { Database } from "../client";
import { billingPlans, billingSubscriptions } from "../schema";

const EFFECTIVE_STATUSES: Array<"PENDING" | "ACTIVE" | "PAST_DUE"> = ["PENDING", "ACTIVE", "PAST_DUE"];

export function createBillingSubscriptionRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      planId: string;
      provider: "MERCADO_PAGO";
      providerSubscriptionId: string | null;
      status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
    }) {
      return database.insert(billingSubscriptions).values(input).returning().then(([subscription]) => subscription);
    },

    findByIdForUser(subscriptionId: string, userId: string) {
      return database.select().from(billingSubscriptions)
        .where(and(eq(billingSubscriptions.id, subscriptionId), eq(billingSubscriptions.userId, userId)))
        .limit(1)
        .then(([subscription]) => subscription);
    },

    findEffectiveForUser(userId: string) {
      return database.select().from(billingSubscriptions)
        .where(and(eq(billingSubscriptions.userId, userId), inArray(billingSubscriptions.status, EFFECTIVE_STATUSES)))
        .limit(1)
        .then(([subscription]) => subscription);
    },

    listForUser(userId: string) {
      return database.select().from(billingSubscriptions).where(eq(billingSubscriptions.userId, userId));
    },

    // Unscoped by design: used by the reconciliation job, which runs as a system process rather
    // than on behalf of one user.
    listReconcilable() {
      return database.select().from(billingSubscriptions).where(inArray(billingSubscriptions.status, EFFECTIVE_STATUSES));
    },

    attachProviderReference(subscriptionId: string, input: { providerSubscriptionId: string; status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED" }) {
      return database.update(billingSubscriptions)
        .set({ providerSubscriptionId: input.providerSubscriptionId, status: input.status, updatedAt: new Date() })
        .where(eq(billingSubscriptions.id, subscriptionId))
        .returning()
        .then(([subscription]) => subscription);
    },

    // Optimistic, idempotent: only ACTIVE transitions to PAST_DUE. Already-PAST_DUE/terminal
    // subscriptions are left untouched — the authoritative provider subscription webhook (or a
    // reconcile pass) is what eventually confirms/corrects this.
    markPastDueIfActive(subscriptionId: string) {
      return database.update(billingSubscriptions)
        .set({ status: "PAST_DUE", updatedAt: new Date() })
        .where(and(eq(billingSubscriptions.id, subscriptionId), eq(billingSubscriptions.status, "ACTIVE")))
        .returning()
        .then(([subscription]) => subscription);
    },

    // Unscoped by design: used by the grace-period expiration sweep, a system process.
    listPastDue() {
      return database.select().from(billingSubscriptions).where(eq(billingSubscriptions.status, "PAST_DUE"));
    },

    markExpiredIfPastDue(subscriptionId: string) {
      return database.update(billingSubscriptions)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(and(eq(billingSubscriptions.id, subscriptionId), eq(billingSubscriptions.status, "PAST_DUE")))
        .returning()
        .then(([subscription]) => subscription);
    },

    markFailed(subscriptionId: string, reason?: { reasonCode: string | null; reasonComment: string | null }) {
      return database.update(billingSubscriptions)
        .set({ status: "CANCELLED", cancelledAt: new Date(), cancellationReasonCode: reason?.reasonCode ?? null, cancellationReasonComment: reason?.reasonComment ?? null, updatedAt: new Date() })
        .where(eq(billingSubscriptions.id, subscriptionId))
        .returning()
        .then(([subscription]) => subscription);
    },

    // Layered on top of the provider-driven cancellation (which flows through the generic
    // subscription synchronizer and must stay webhook-safe): captures the optional, non-blocking
    // cancellation feedback independently of status/period fields.
    recordCancellationReason(subscriptionId: string, reason: { reasonCode: string | null; reasonComment: string | null }) {
      return database.update(billingSubscriptions)
        .set({ cancellationReasonCode: reason.reasonCode, cancellationReasonComment: reason.reasonComment, updatedAt: new Date() })
        .where(eq(billingSubscriptions.id, subscriptionId))
        .returning()
        .then(([subscription]) => subscription);
    },

    // Unscoped lookups: webhook processing has no user session, only provider-supplied identifiers.
    findById(subscriptionId: string) {
      return database.select().from(billingSubscriptions)
        .where(eq(billingSubscriptions.id, subscriptionId))
        .limit(1)
        .then(([subscription]) => subscription);
    },

    findByProviderSubscriptionId(providerSubscriptionId: string) {
      return database.select().from(billingSubscriptions)
        .where(eq(billingSubscriptions.providerSubscriptionId, providerSubscriptionId))
        .limit(1)
        .then(([subscription]) => subscription);
    },

    // Unscoped by design: powers the admin reconciliation dashboard's stale-PENDING queue, a
    // system-wide operational view. A subscription stuck PENDING past `olderThan` means the
    // provider checkout was likely abandoned or its confirming webhook never arrived.
    listStalePending(olderThan: Date) {
      return database.select().from(billingSubscriptions)
        .where(and(eq(billingSubscriptions.status, "PENDING"), lt(billingSubscriptions.createdAt, olderThan)));
    },

    // Unscoped by design: powers the admin commercial overview dashboard's Active Pro / MRR
    // metrics — a system-wide count, not a per-user query.
    listByStatus(status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED") {
      return database.select().from(billingSubscriptions).where(eq(billingSubscriptions.status, status));
    },

    // Sum of the current plan price for every ACTIVE subscription — a simple, honest MRR
    // approximation (does not account for proration, currency conversion across plans, or
    // mid-cycle plan changes, none of which exist yet in this codebase).
    async sumActiveMonthlyRevenue(): Promise<{ amount: string; currencyCode: string } | null> {
      const rows = await database.select({ price: billingPlans.price, currencyCode: billingPlans.currencyCode })
        .from(billingSubscriptions)
        .innerJoin(billingPlans, eq(billingPlans.id, billingSubscriptions.planId))
        .where(eq(billingSubscriptions.status, "ACTIVE"));

      if (rows.length === 0) return null;
      const currencyCode = rows[0].currencyCode;
      const total = rows.reduce((sum, row) => (row.currencyCode === currencyCode ? sum + Number(row.price) : sum), 0);
      return { amount: total.toFixed(2), currencyCode };
    },

    updateStatusAndPeriod(subscriptionId: string, input: {
      status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED";
      providerSubscriptionId: string;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
    }) {
      return database.update(billingSubscriptions)
        .set({
          status: input.status,
          providerSubscriptionId: input.providerSubscriptionId,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
          cancelledAt: input.status === "CANCELLED" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(billingSubscriptions.id, subscriptionId))
        .returning()
        .then(([subscription]) => subscription);
    },
  };
}
