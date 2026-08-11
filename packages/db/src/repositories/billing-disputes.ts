import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { billingDisputes } from "../schema";

export function createBillingDisputeRepository(database: Database) {
  return {
    // Unscoped by design: dispute webhook processing has no user session, only the provider's
    // own dispute id.
    findByProviderDisputeId(providerDisputeId: string) {
      return database.select().from(billingDisputes).where(eq(billingDisputes.providerDisputeId, providerDisputeId)).limit(1).then(([dispute]) => dispute);
    },

    listForPayment(paymentId: string) {
      return database.select().from(billingDisputes).where(eq(billingDisputes.paymentId, paymentId));
    },

    create(input: {
      paymentId: string;
      providerDisputeId: string;
      type: string;
      status: "OPEN" | "WON" | "LOST" | "CLOSED";
      amount: string;
      currencyCode: string;
      openedAt: Date;
      resolvedAt: Date | null;
      metadata: unknown;
    }) {
      return database.insert(billingDisputes).values(input).returning().then(([dispute]) => dispute);
    },

    updateStatus(disputeId: string, input: { status: "OPEN" | "WON" | "LOST" | "CLOSED"; resolvedAt: Date | null }) {
      return database.update(billingDisputes)
        .set({ status: input.status, resolvedAt: input.resolvedAt, updatedAt: new Date() })
        .where(eq(billingDisputes.id, disputeId))
        .returning()
        .then(([dispute]) => dispute);
    },
  };
}
