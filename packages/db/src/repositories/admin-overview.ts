import { eq, gt, notInArray, sql } from "drizzle-orm";

import type { Database } from "../client";
import { billingRefunds, billingSubscriptions, billingWebhookEvents, promotionalAccessGrants, users } from "../schema";
import { createBillingSubscriptionRepository } from "./billing-subscriptions";

// Backs the commercial overview dashboard (TASK-060) — every method here is a plain count/list
// over local tables, composed by get-commercial-overview-metrics.ts. No provider call, ever.
export function createAdminOverviewRepository(database: Database) {
  return {
    countActiveSubscriptions() {
      return database.select({ count: sql<number>`count(*)::int` }).from(billingSubscriptions)
        .where(eq(billingSubscriptions.status, "ACTIVE"))
        .then(([row]) => row?.count ?? 0);
    },

    countPastDueSubscriptions() {
      return database.select({ count: sql<number>`count(*)::int` }).from(billingSubscriptions)
        .where(eq(billingSubscriptions.status, "PAST_DUE"))
        .then(([row]) => row?.count ?? 0);
    },

    sumActiveMonthlyRevenue() {
      return createBillingSubscriptionRepository(database).sumActiveMonthlyRevenue();
    },

    listUserIdsWithActiveSubscription() {
      return database.selectDistinct({ userId: billingSubscriptions.userId }).from(billingSubscriptions)
        .where(eq(billingSubscriptions.status, "ACTIVE"))
        .then((rows) => rows.map((row) => row.userId));
    },

    listUserIdsWithActivePromotionalGrant() {
      return database.selectDistinct({ userId: promotionalAccessGrants.userId }).from(promotionalAccessGrants)
        .where(eq(promotionalAccessGrants.status, "ACTIVE"))
        .then((rows) => rows.map((row) => row.userId));
    },

    countActivePromotionalGrantsExcludingUsers(excludedUserIds: string[]) {
      const condition = excludedUserIds.length > 0
        ? sql`${promotionalAccessGrants.status} = 'ACTIVE' and ${notInArray(promotionalAccessGrants.userId, excludedUserIds)}`
        : sql`${promotionalAccessGrants.status} = 'ACTIVE'`;
      return database.select({ count: sql<number>`count(*)::int` }).from(promotionalAccessGrants)
        .where(condition)
        .then(([row]) => row?.count ?? 0);
    },

    countActiveTrialUsersExcluding(now: Date, excludedUserIds: string[]) {
      const condition = excludedUserIds.length > 0
        ? sql`${gt(users.trialEndsAt, now)} and ${notInArray(users.id, excludedUserIds)}`
        : gt(users.trialEndsAt, now);
      return database.select({ count: sql<number>`count(*)::int` }).from(users)
        .where(condition)
        .then(([row]) => row?.count ?? 0);
    },

    countTotalUsers() {
      return database.select({ count: sql<number>`count(*)::int` }).from(users).then(([row]) => row?.count ?? 0);
    },

    countPendingRefunds() {
      return database.select({ count: sql<number>`count(*)::int` }).from(billingRefunds)
        .where(eq(billingRefunds.status, "PENDING"))
        .then(([row]) => row?.count ?? 0);
    },

    countFailedWebhooks() {
      return database.select({ count: sql<number>`count(*)::int` }).from(billingWebhookEvents)
        .where(eq(billingWebhookEvents.status, "FAILED"))
        .then(([row]) => row?.count ?? 0);
    },
  };
}
