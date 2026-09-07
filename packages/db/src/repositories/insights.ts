import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "../client";
import { insights, type insightStatusEnum } from "../schema";

type InsightStatusValue = (typeof insightStatusEnum.enumValues)[number];
const OPEN_STATUSES: InsightStatusValue[] = ["DETECTED", "ACTIVE", "SEEN"];

export type InsightFeedbackValue = "USEFUL" | "NOT_USEFUL" | "NOT_APPLICABLE" | "ALREADY_KNEW" | "WRONG_DATA";

export function createInsightRepository(database: Database) {
  return {
    listForUser(userId: string, options: { statuses?: readonly InsightStatusValue[] } = {}) {
      return database
        .select()
        .from(insights)
        .where(
          options.statuses
            ? and(eq(insights.userId, userId), inArray(insights.status, [...options.statuses]))
            : eq(insights.userId, userId),
        )
        .orderBy(desc(insights.detectedAt));
    },

    listOpenForUser(userId: string) {
      return database
        .select()
        .from(insights)
        .where(and(eq(insights.userId, userId), inArray(insights.status, OPEN_STATUSES)));
    },

    /** New/unseen insights — the count behind the sidebar badge (spec 13 §6.13). ACTIVE only:
     * once the user opens one it becomes SEEN and stops counting. */
    countActiveForUser(userId: string) {
      return database
        .select({ count: sql<number>`count(*)::int` })
        .from(insights)
        .where(and(eq(insights.userId, userId), eq(insights.status, "ACTIVE")))
        .then(([row]) => row?.count ?? 0);
    },

    findByIdForUser(insightId: string, userId: string) {
      return database
        .select()
        .from(insights)
        .where(and(eq(insights.id, insightId), eq(insights.userId, userId)))
        .limit(1)
        .then(([row]) => row);
    },

    insert(input: typeof insights.$inferInsert) {
      return database.insert(insights).values(input).returning().then(([row]) => row);
    },

    /** Refresh copy/evidence for an existing row; optionally lift a dismissal back to ACTIVE. */
    refresh(
      insightId: string,
      input: {
        title: string;
        body: string;
        confidence: "LOW" | "MEDIUM" | "HIGH";
        impactAmount: string | null;
        impactCurrency: string | null;
        ctaLabel: string | null;
        ctaHref: string | null;
        evidence: unknown;
        calculationVersion: string;
        reactivate: boolean;
      },
    ) {
      return database
        .update(insights)
        .set({
          title: input.title,
          body: input.body,
          confidence: input.confidence,
          impactAmount: input.impactAmount,
          impactCurrency: input.impactCurrency,
          ctaLabel: input.ctaLabel,
          ctaHref: input.ctaHref,
          evidence: input.evidence,
          calculationVersion: input.calculationVersion,
          updatedAt: new Date(),
          ...(input.reactivate ? { status: "ACTIVE" as const, dismissedAt: null, feedback: null, detectedAt: new Date() } : {}),
        })
        .where(eq(insights.id, insightId))
        .returning()
        .then(([row]) => row);
    },

    resolve(insightId: string, at: Date) {
      return database
        .update(insights)
        .set({ status: "RESOLVED", resolvedAt: at, updatedAt: at })
        .where(eq(insights.id, insightId))
        .returning()
        .then(([row]) => row);
    },

    markSeenForUser(userId: string, insightIds: string[], at: Date) {
      if (insightIds.length === 0) return Promise.resolve([]);
      return database
        .update(insights)
        .set({ status: "SEEN", seenAt: at, updatedAt: at })
        .where(and(eq(insights.userId, userId), inArray(insights.id, insightIds), eq(insights.status, "ACTIVE")))
        .returning();
    },

    dismissForUser(insightId: string, userId: string, feedback: InsightFeedbackValue | null, at: Date) {
      return database
        .update(insights)
        .set({ status: "DISMISSED", dismissedAt: at, feedback, updatedAt: at })
        .where(and(eq(insights.id, insightId), eq(insights.userId, userId)))
        .returning()
        .then(([row]) => row);
    },

    resolveForUser(insightId: string, userId: string, feedback: InsightFeedbackValue | null, at: Date) {
      return database
        .update(insights)
        .set({ status: "RESOLVED", resolvedAt: at, feedback, updatedAt: at })
        .where(and(eq(insights.id, insightId), eq(insights.userId, userId)))
        .returning()
        .then(([row]) => row);
    },
  };
}
