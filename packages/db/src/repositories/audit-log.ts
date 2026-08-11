import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { Database } from "../client";
import { auditLog } from "../schema";

export function createAuditLogRepository(database: Database) {
  return {
    // Append-only: intentionally the only write method on this repository. No update/delete
    // method exists (Domain Rule: "never editable from the UI").
    record(input: {
      actorUserId: string;
      action: string;
      entityType: string;
      entityId: string | null;
      targetUserId: string | null;
      beforeSnapshot: unknown;
      afterSnapshot: unknown;
      reason: string | null;
    }) {
      return database.insert(auditLog).values(input).returning().then(([row]) => row);
    },

    async search(filters: {
      actorUserId?: string;
      targetUserId?: string;
      entityType?: string;
      action?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    }) {
      const conditions = [
        filters.actorUserId ? eq(auditLog.actorUserId, filters.actorUserId) : undefined,
        filters.targetUserId ? eq(auditLog.targetUserId, filters.targetUserId) : undefined,
        filters.entityType ? eq(auditLog.entityType, filters.entityType) : undefined,
        filters.action ? eq(auditLog.action, filters.action) : undefined,
        filters.from ? gte(auditLog.createdAt, filters.from) : undefined,
        filters.to ? lte(auditLog.createdAt, filters.to) : undefined,
      ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined);

      return database.select().from(auditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLog.createdAt))
        .limit(Math.min(filters.limit ?? 50, 200));
    },

    countForTargetUser(targetUserId: string) {
      return database.select({ count: sql<number>`count(*)::int` }).from(auditLog)
        .where(eq(auditLog.targetUserId, targetUserId))
        .then(([row]) => row?.count ?? 0);
    },
  };
}
