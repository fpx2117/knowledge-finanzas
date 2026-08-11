import { and, count, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { analyticsConsentHistory, analyticsConsents } from "../schema";

export function createAnalyticsConsentRepository(database: Database) {
  return {
    findCurrentForUser(userId: string, purpose: string) {
      return database.select().from(analyticsConsents)
        .where(and(eq(analyticsConsents.userId, userId), eq(analyticsConsents.purpose, purpose)))
        .limit(1)
        .then(([row]) => row);
    },

    listForUser(userId: string) {
      return database.select().from(analyticsConsents).where(eq(analyticsConsents.userId, userId));
    },

    // Feeds GenerateCohortAggregate:v1's eligibility filter (packages/privacy's
    // isEligibleForAggregation) — the pipeline still applies the internal/test-account exclusion
    // itself on top of this list, this only resolves the consent half.
    listUserIdsWithGrantedConsent(purpose: string) {
      return database.select({ userId: analyticsConsents.userId }).from(analyticsConsents)
        .where(and(eq(analyticsConsents.purpose, purpose), eq(analyticsConsents.status, "GRANTED")))
        .then((rows) => rows.map((row) => row.userId));
    },

    async countUsersWithGrantedConsent(purpose: string) {
      const [row] = await database.select({ value: count() }).from(analyticsConsents)
        .where(and(eq(analyticsConsents.purpose, purpose), eq(analyticsConsents.status, "GRANTED")));
      return row?.value ?? 0;
    },

    // Atomic: the current (user, purpose) row and the append-only history row are written in the
    // same transaction, so a reader can never observe one without the other.
    async upsertAndRecordHistory(input: { userId: string; purpose: string; status: string; policyVersion: string; occurredAt: Date }) {
      return database.transaction(async (tx) => {
        // grantedAt/withdrawnAt each only ever move forward on their own matching action — a
        // WITHDRAW never erases when consent was originally granted, and a re-GRANT clears the
        // prior withdrawal, so the receipt always reflects the most recent transition of each kind.
        const [consent] = await tx.insert(analyticsConsents).values({
          userId: input.userId,
          purpose: input.purpose,
          status: input.status,
          policyVersion: input.policyVersion,
          grantedAt: input.status === "GRANTED" ? input.occurredAt : null,
          withdrawnAt: input.status === "WITHDRAWN" ? input.occurredAt : null,
        }).onConflictDoUpdate({
          target: [analyticsConsents.userId, analyticsConsents.purpose],
          set: {
            status: input.status,
            policyVersion: input.policyVersion,
            ...(input.status === "GRANTED" ? { grantedAt: input.occurredAt, withdrawnAt: null } : { withdrawnAt: input.occurredAt }),
          },
        }).returning();

        await tx.insert(analyticsConsentHistory).values({
          userId: input.userId,
          purpose: input.purpose,
          action: input.status,
          policyVersion: input.policyVersion,
          occurredAt: input.occurredAt,
        });

        return consent;
      });
    },

    listHistoryForUser(userId: string, purpose?: string) {
      return database.select().from(analyticsConsentHistory)
        .where(purpose ? and(eq(analyticsConsentHistory.userId, userId), eq(analyticsConsentHistory.purpose, purpose)) : eq(analyticsConsentHistory.userId, userId))
        .orderBy(desc(analyticsConsentHistory.occurredAt));
    },
  };
}
