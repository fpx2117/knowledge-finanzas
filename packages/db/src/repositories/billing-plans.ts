import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { billingPlans } from "../schema";

export function createBillingPlanRepository(database: Database) {
  return {
    findActiveByCode(code: string) {
      return database.select().from(billingPlans)
        .where(eq(billingPlans.code, code))
        .limit(1)
        .then(([plan]) => (plan?.active ? plan : undefined));
    },

    findById(planId: string) {
      return database.select().from(billingPlans)
        .where(eq(billingPlans.id, planId))
        .limit(1)
        .then(([plan]) => plan);
    },

    findByCode(code: string) {
      return database.select().from(billingPlans)
        .where(eq(billingPlans.code, code))
        .limit(1)
        .then(([plan]) => plan);
    },

    listActive() {
      return database.select().from(billingPlans).where(eq(billingPlans.active, true));
    },

    upsertByCode(input: {
      code: string;
      name: string;
      price: string;
      currencyCode: string;
      providerPlanId: string | null;
      active: boolean;
    }) {
      return database.insert(billingPlans)
        .values(input)
        .onConflictDoUpdate({
          target: billingPlans.code,
          set: {
            name: input.name,
            price: input.price,
            currencyCode: input.currencyCode,
            providerPlanId: input.providerPlanId,
            active: input.active,
            updatedAt: new Date(),
          },
        })
        .returning()
        .then(([plan]) => plan);
    },
  };
}
