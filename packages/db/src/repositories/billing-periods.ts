import { and, eq } from "drizzle-orm";

import type { Database } from "../client";
import { billingPeriods } from "../schema";

export function createBillingPeriodRepository(database: Database) {
  return {
    // Idempotent upsert keyed on (subscriptionId, startsAt, endsAt): returns whether the row
    // was newly created so the caller can fire idempotent downstream grants exactly once.
    async upsertPeriod(input: {
      subscriptionId: string;
      startsAt: Date;
      endsAt: Date;
      status: "PENDING" | "ACTIVE" | "CLOSED" | "FAILED";
      providerReference: string | null;
    }) {
      const inserted = await database.insert(billingPeriods)
        .values(input)
        .onConflictDoNothing({ target: [billingPeriods.subscriptionId, billingPeriods.startsAt, billingPeriods.endsAt] })
        .returning();

      if (inserted[0]) return { period: inserted[0], created: true };

      const [existing] = await database.select().from(billingPeriods)
        .where(and(
          eq(billingPeriods.subscriptionId, input.subscriptionId),
          eq(billingPeriods.startsAt, input.startsAt),
          eq(billingPeriods.endsAt, input.endsAt),
        ))
        .limit(1);

      return { period: existing, created: false };
    },

    listForSubscription(subscriptionId: string) {
      return database.select().from(billingPeriods).where(eq(billingPeriods.subscriptionId, subscriptionId));
    },
  };
}
