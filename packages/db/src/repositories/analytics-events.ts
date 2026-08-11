import { and, countDistinct, eq, gte } from "drizzle-orm";

import type { Database } from "../client";
import { analyticsEventLog } from "../schema";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === UNIQUE_VIOLATION;
}

export function createAnalyticsEventRepository(database: Database) {
  return {
    // Implements @know-finanzas/analytics' AnalyticsProvider port — the MVP, fully-owned
    // provider (Database Changes: "if PostgreSQL-backed aggregate tables are used for MVP
    // KPIs"). A unique violation on eventId means this exact critical event was already
    // recorded (retried webhook, duplicate submit) — absorbed as created:false, never an error.
    async record(event: {
      eventId: string | null;
      eventName: string;
      eventVersion: number;
      userId: string | null;
      occurredAt: Date;
      environment: string;
      internal: boolean;
      properties: unknown;
    }) {
      try {
        await database.insert(analyticsEventLog).values({
          eventId: event.eventId,
          eventName: event.eventName,
          eventVersion: event.eventVersion,
          userId: event.userId,
          occurredAt: event.occurredAt,
          environment: event.environment,
          internal: event.internal,
          properties: event.properties as object,
        });
        return { created: true };
      } catch (error) {
        if (isUniqueViolation(error)) return { created: false };
        throw error;
      }
    },

    async hasEventForUserSince(eventName: string, userId: string, since: Date) {
      const [row] = await database.select({ id: analyticsEventLog.id }).from(analyticsEventLog)
        .where(and(eq(analyticsEventLog.eventName, eventName), eq(analyticsEventLog.userId, userId), gte(analyticsEventLog.occurredAt, since)))
        .limit(1);
      return Boolean(row);
    },

    // Excludes internal/staff/test accounts from the count (task's Domain Rule/Acceptance
    // Criterion: "internal/staff/test accounts are excluded from all MVP KPI calculations").
    async countDistinctUsersForEvent(eventName: string, since?: Date) {
      const conditions = since
        ? and(eq(analyticsEventLog.eventName, eventName), eq(analyticsEventLog.internal, false), gte(analyticsEventLog.occurredAt, since))
        : and(eq(analyticsEventLog.eventName, eventName), eq(analyticsEventLog.internal, false));
      const [row] = await database.select({ value: countDistinct(analyticsEventLog.userId) }).from(analyticsEventLog).where(conditions);
      return row?.value ?? 0;
    },
  };
}
