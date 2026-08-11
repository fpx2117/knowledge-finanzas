import { and, asc, eq, ilike, isNull, sql } from "drizzle-orm";

import type { Database } from "../client";
import { categories } from "../schema";

export function createCategoryRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      name: string;
      type: "INCOME" | "EXPENSE";
      parentId: string | null;
    }) {
      return database.insert(categories).values({
        ...input,
        status: "ACTIVE",
        archivedAt: null,
      }).returning().then(([category]) => category);
    },

    findByIdForUser(categoryId: string, userId: string) {
      return database.select().from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
        .limit(1)
        .then(([category]) => category);
    },

    findParentByIdForUser(parentId: string, userId: string) {
      return database.select().from(categories)
        .where(and(eq(categories.id, parentId), eq(categories.userId, userId)))
        .limit(1)
        .then(([category]) => category);
    },

  listForUser(userId: string, options: { type?: "INCOME" | "EXPENSE"; includeArchived?: boolean } = {}) {
    return database.select().from(categories)
      .where(and(
        eq(categories.userId, userId),
        options.type ? eq(categories.type, options.type) : undefined,
        options.includeArchived ? undefined : eq(categories.status, "ACTIVE"),
      ))
      .orderBy(asc(categories.name));
  },

  existsActiveWithNameForUser(input: {
    userId: string;
    name: string;
    type: "INCOME" | "EXPENSE";
    parentId: string | null;
    excludeCategoryId?: string;
  }) {
    return database.select({ id: categories.id }).from(categories)
      .where(and(
        eq(categories.userId, input.userId),
        eq(categories.type, input.type),
        eq(categories.status, "ACTIVE"),
        ilike(categories.name, input.name),
        input.parentId ? eq(categories.parentId, input.parentId) : isNull(categories.parentId),
        input.excludeCategoryId ? sql`${categories.id} <> ${input.excludeCategoryId}` : undefined,
      ))
      .limit(1)
      .then(([category]) => Boolean(category));
  },

  updateMetadataForUser(categoryId: string, userId: string, input: { name: string; parentId: string | null }) {
    return database.update(categories)
      .set({ name: input.name, parentId: input.parentId, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), eq(categories.status, "ACTIVE")))
      .returning()
      .then(([category]) => category);
  },

  archiveForUser(categoryId: string, userId: string, archivedAt: Date) {
    return database.update(categories)
      .set({ status: "ARCHIVED", archivedAt, updatedAt: archivedAt })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), eq(categories.status, "ACTIVE")))
      .returning()
      .then(([category]) => category);
  },
};
}
