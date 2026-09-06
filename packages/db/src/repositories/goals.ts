import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

import type { Database } from "../client";
import { goalAllocations, goals } from "../schema";

export type GoalAllocationKind = "INITIAL" | "CONTRIBUTION" | "WITHDRAWAL";

/**
 * WP-GOALS-ALLOC — `goal_allocations` is the source of truth for a goal's progress.
 * `goals.current_amount` is a cache; `derivedCurrentAmount` recomputes it and the
 * goal service updates the cache in the same transaction as every allocation write.
 */
export function createGoalAllocationRepository(database: Database) {
  const signedSum = sql<string>`coalesce(sum(case when ${goalAllocations.kind} = 'WITHDRAWAL' then -${goalAllocations.amount} else ${goalAllocations.amount} end), 0)`;
  return {
    record(input: {
      userId: string;
      goalId: string;
      kind: GoalAllocationKind;
      amount: string;
      currencyCode: string;
      occurredOn: string;
      note: string | null;
      accountId?: string | null;
      relatedTransactionId?: string | null;
    }) {
      return database
        .insert(goalAllocations)
        .values({
          userId: input.userId,
          goalId: input.goalId,
          kind: input.kind,
          amount: input.amount,
          currencyCode: input.currencyCode,
          occurredOn: input.occurredOn,
          note: input.note,
          accountId: input.accountId ?? null,
          relatedTransactionId: input.relatedTransactionId ?? null,
        })
        .returning()
        .then(([row]) => row);
    },

    async derivedCurrentAmount(goalId: string): Promise<string> {
      const [row] = await database
        .select({ total: signedSum })
        .from(goalAllocations)
        .where(eq(goalAllocations.goalId, goalId));
      return row?.total ?? "0";
    },

    /** Per-goal allocation evidence for pace: how many allocations and the earliest date. */
    async aggregatesForUser(userId: string): Promise<Map<string, { count: number; firstOn: string | null }>> {
      const rows = await database
        .select({
          goalId: goalAllocations.goalId,
          count: sql<number>`count(*)`,
          firstOn: sql<string | null>`min(${goalAllocations.occurredOn})`,
        })
        .from(goalAllocations)
        .where(eq(goalAllocations.userId, userId))
        .groupBy(goalAllocations.goalId);
      return new Map(rows.map((row) => [row.goalId, { count: Number(row.count), firstOn: row.firstOn }]));
    },

    listForGoal(goalId: string, userId: string) {
      return database
        .select()
        .from(goalAllocations)
        .where(and(eq(goalAllocations.goalId, goalId), eq(goalAllocations.userId, userId)))
        .orderBy(desc(goalAllocations.occurredOn), desc(goalAllocations.createdAt));
    },
  };
}

export type GoalCategory =
  | "EMERGENCY_FUND"
  | "TRAVEL"
  | "VEHICLE"
  | "HOME"
  | "EDUCATION"
  | "PURCHASE"
  | "INVESTMENT"
  | "OTHER";

export function createGoalRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      name: string;
      category: GoalCategory;
      currencyCode: string;
      targetAmount: string;
      currentAmount: string;
      targetDate: string | null;
      notes: string | null;
    }) {
      return database
        .insert(goals)
        .values({ ...input, status: "ACTIVE" })
        .returning()
        .then(([goal]) => goal);
    },

    findByIdForUser(goalId: string, userId: string) {
      return database
        .select()
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .limit(1)
        .then(([goal]) => goal);
    },

    listForUser(userId: string, options: { includeArchived?: boolean } = {}) {
      return database
        .select()
        .from(goals)
        .where(
          options.includeArchived
            ? eq(goals.userId, userId)
            : and(eq(goals.userId, userId), eq(goals.status, "ACTIVE")),
        )
        .orderBy(asc(goals.status), asc(goals.targetDate), desc(goals.createdAt));
    },

    updateDetailsForUser(
      goalId: string,
      userId: string,
      input: { name: string; category: GoalCategory; targetAmount: string; targetDate: string | null; notes: string | null },
    ) {
      return database
        .update(goals)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId), eq(goals.status, "ACTIVE")))
        .returning()
        .then(([goal]) => goal);
    },

    setProgressForUser(
      goalId: string,
      userId: string,
      input: { currentAmount: string; status: "ACTIVE" | "COMPLETED"; completedAt: Date | null },
    ) {
      return database
        .update(goals)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId), eq(goals.status, "ACTIVE")))
        .returning()
        .then(([goal]) => goal);
    },

    // WP-GOALS-ALLOC — sync the cached progress after an allocation write. Works on ACTIVE and
    // COMPLETED goals (a withdrawal can re-open a completed goal); never touches ARCHIVED ones.
    syncDerivedProgressForUser(
      goalId: string,
      userId: string,
      input: { currentAmount: string; status: "ACTIVE" | "COMPLETED"; completedAt: Date | null },
    ) {
      return database
        .update(goals)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId), ne(goals.status, "ARCHIVED")))
        .returning()
        .then(([goal]) => goal);
    },

    archiveForUser(goalId: string, userId: string, archivedAt: Date) {
      return database
        .update(goals)
        .set({ status: "ARCHIVED", archivedAt, updatedAt: archivedAt })
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
        .returning()
        .then(([goal]) => goal);
    },
  };
}
