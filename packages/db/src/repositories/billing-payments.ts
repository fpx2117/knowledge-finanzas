import { and, eq, isNotNull, sql } from "drizzle-orm";

import type { Database } from "../client";
import { billingPayments } from "../schema";

export function createBillingPaymentRepository(database: Database) {
  return {
    findById(paymentId: string) {
      return database.select().from(billingPayments).where(eq(billingPayments.id, paymentId)).limit(1).then(([payment]) => payment);
    },

    // Unscoped by design: refund/dispute webhook processing has no user session, only the
    // provider's own payment id.
    findByProviderPaymentId(providerPaymentId: string) {
      return database.select().from(billingPayments).where(eq(billingPayments.providerPaymentId, providerPaymentId)).limit(1).then(([payment]) => payment);
    },

    // Unscoped by design: used by the duplicate-charge detection sweep, a system process. Only
    // APPROVED payments tied to a billing period can be "duplicates" — a period is only ever
    // supposed to be paid once.
    listApprovedWithPeriod() {
      return database.select().from(billingPayments)
        .where(and(eq(billingPayments.status, "APPROVED"), isNotNull(billingPayments.billingPeriodId)));
    },
    // Idempotent upsert keyed on providerPaymentId: repeated webhook deliveries for the same
    // payment always converge to the provider's latest reported status/fee/net amount.
    upsertByProviderPaymentId(input: {
      userId: string;
      subscriptionId: string;
      billingPeriodId: string | null;
      providerPaymentId: string;
      status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";
      grossAmount: string;
      currencyCode: string;
      providerFee: string | null;
      netAmount: string | null;
      paidAt: Date | null;
    }) {
      return database.insert(billingPayments)
        .values(input)
        .onConflictDoUpdate({
          target: billingPayments.providerPaymentId,
          // The unique index on providerPaymentId is partial ("where providerPaymentId is not
          // null"); Postgres only matches it as a conflict target when the predicate is repeated.
          targetWhere: sql`${billingPayments.providerPaymentId} is not null`,
          set: {
            status: input.status,
            billingPeriodId: input.billingPeriodId,
            providerFee: input.providerFee,
            netAmount: input.netAmount,
            paidAt: input.paidAt,
            updatedAt: new Date(),
          },
        })
        .returning()
        .then(([payment]) => payment);
    },

    listForUser(userId: string) {
      return database.select().from(billingPayments).where(eq(billingPayments.userId, userId));
    },
  };
}
