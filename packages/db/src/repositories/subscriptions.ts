import { and, desc, eq, inArray, ne, notInArray } from "drizzle-orm";

import type { Database } from "../client";
import { subscriptions } from "../schema";

export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "DISMISSED";

export function createSubscriptionRepository(database: Database) {
  return {
    listForUser(userId: string, status?: SubscriptionStatus | SubscriptionStatus[]) {
      const statusFilter = status
        ? Array.isArray(status)
          ? inArray(subscriptions.status, status)
          : eq(subscriptions.status, status)
        : undefined;
      return database
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), statusFilter))
        .orderBy(desc(subscriptions.lastChargedOn));
    },

    /** Insert a detected subscription or refresh an existing non-DISMISSED one. */
    upsert(input: {
      userId: string;
      merchantId: string;
      label: string;
      frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
      currencyCode: string;
      currentAmount: string;
      priceHistory: Array<{ amount: string; from: string }>;
      categoryId: string | null;
      firstChargedOn: string;
      lastChargedOn: string;
      nextExpectedOn: string;
      chargeCount: number;
      confidence: number;
    }) {
      const values = {
        userId: input.userId,
        merchantId: input.merchantId,
        label: input.label,
        frequency: input.frequency,
        currencyCode: input.currencyCode,
        currentAmount: input.currentAmount,
        priceHistory: input.priceHistory,
        categoryId: input.categoryId,
        firstChargedOn: input.firstChargedOn,
        lastChargedOn: input.lastChargedOn,
        nextExpectedOn: input.nextExpectedOn,
        chargeCount: input.chargeCount,
        confidence: input.confidence.toFixed(3),
      };
      return database
        .insert(subscriptions)
        .values({ ...values, status: "ACTIVE" })
        .onConflictDoUpdate({
          target: [subscriptions.userId, subscriptions.merchantId, subscriptions.currencyCode],
          set: {
            label: values.label,
            frequency: values.frequency,
            currentAmount: values.currentAmount,
            priceHistory: values.priceHistory,
            categoryId: values.categoryId,
            lastChargedOn: values.lastChargedOn,
            nextExpectedOn: values.nextExpectedOn,
            chargeCount: values.chargeCount,
            confidence: values.confidence,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
          setWhere: ne(subscriptions.status, "DISMISSED"),
        })
        .returning()
        .then(([row]) => row);
    },

    /** Mark ACTIVE subscriptions whose merchant is no longer detected as INACTIVE (keep the row). */
    deactivateMissing(userId: string, keepMerchantCurrencyKeys: string[]) {
      return database
        .update(subscriptions)
        .set({ status: "INACTIVE", updatedAt: new Date() })
        .where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "ACTIVE"),
          keepMerchantCurrencyKeys.length > 0
            ? notInArray(subscriptions.merchantId, keepMerchantCurrencyKeys)
            : undefined,
        ))
        .returning();
    },

    setStatusForUser(subscriptionId: string, userId: string, status: SubscriptionStatus) {
      return database
        .update(subscriptions)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
        .returning()
        .then(([row]) => row);
    },

    dismissedMerchantIds(userId: string) {
      return database
        .select({ merchantId: subscriptions.merchantId })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "DISMISSED")))
        .then((rows) => rows.map((r) => r.merchantId));
    },
  };
}
