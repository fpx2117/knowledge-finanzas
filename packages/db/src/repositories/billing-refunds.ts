import { desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { billingRefunds } from "../schema";

export function createBillingRefundRepository(database: Database) {
  return {
    findByIdempotencyKey(requestIdempotencyKey: string) {
      return database.select().from(billingRefunds).where(eq(billingRefunds.requestIdempotencyKey, requestIdempotencyKey)).limit(1).then(([refund]) => refund);
    },

    findById(refundId: string) {
      return database.select().from(billingRefunds).where(eq(billingRefunds.id, refundId)).limit(1).then(([refund]) => refund);
    },

    // Most recent refund attempt against a given payment (a payment is refunded at most once in
    // V1 full-refund-only scope, but this reads the latest row regardless).
    findLatestForPayment(paymentId: string) {
      return database.select().from(billingRefunds).where(eq(billingRefunds.paymentId, paymentId))
        .orderBy(desc(billingRefunds.createdAt)).limit(1).then(([refund]) => refund);
    },

    // Idempotent on requestIdempotencyKey: a race between two callers using the same key
    // converges on the row the winner inserted, never a second provider-facing refund.
    async create(input: {
      paymentId: string;
      amount: string;
      currencyCode: string;
      reason: "DUPLICATE_CHARGE" | "SERVICE_FAILURE" | "FULL_SUBSCRIPTION_REVERSAL";
      requestedBy: string;
      requestIdempotencyKey: string;
    }) {
      const inserted = await database.insert(billingRefunds)
        .values(input)
        .onConflictDoNothing({ target: billingRefunds.requestIdempotencyKey })
        .returning();

      if (inserted[0]) return { refund: inserted[0], created: true };

      const [existing] = await database.select().from(billingRefunds).where(eq(billingRefunds.requestIdempotencyKey, input.requestIdempotencyKey)).limit(1);
      return { refund: existing, created: false };
    },

    markApproved(refundId: string, input: { providerRefundId: string | null; completedAt: Date }) {
      return database.update(billingRefunds)
        .set({ status: "APPROVED", providerRefundId: input.providerRefundId, completedAt: input.completedAt, updatedAt: new Date() })
        .where(eq(billingRefunds.id, refundId))
        .returning()
        .then(([refund]) => refund);
    },

    markFailed(refundId: string, input: { failureReason: string }) {
      return database.update(billingRefunds)
        .set({ status: "FAILED", failureReason: input.failureReason, updatedAt: new Date() })
        .where(eq(billingRefunds.id, refundId))
        .returning()
        .then(([refund]) => refund);
    },

    // Unscoped by design: used by the refund reconciliation sweep, a system process.
    listPending() {
      return database.select().from(billingRefunds).where(eq(billingRefunds.status, "PENDING"));
    },
  };
}
