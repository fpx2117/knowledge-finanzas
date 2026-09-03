import { and, asc, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { goals } from "../schema";

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
