import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { categoryMap, categoryTaxonomy } from "../schema";

export type CategoryMapSource = "SEED" | "USER" | "MODEL";

export function createCategoryMapRepository(database: Database) {
  return {
    listForUser(userId: string) {
      return database
        .select({
          userCategoryId: categoryMap.userCategoryId,
          taxonomyNodeId: categoryMap.taxonomyNodeId,
          taxonomySlug: categoryTaxonomy.slug,
          source: categoryMap.source,
          confidence: categoryMap.confidence,
        })
        .from(categoryMap)
        .innerJoin(categoryTaxonomy, eq(categoryTaxonomy.id, categoryMap.taxonomyNodeId))
        .where(eq(categoryMap.userId, userId));
    },

    findForUserCategory(userCategoryId: string) {
      return database
        .select()
        .from(categoryMap)
        .where(eq(categoryMap.userCategoryId, userCategoryId))
        .limit(1)
        .then(([row]) => row);
    },

    /** Insert or replace the mapping for a user category. `userCategoryId` is unique. */
    upsert(input: {
      userId: string;
      userCategoryId: string;
      taxonomyNodeId: string;
      source: CategoryMapSource;
      confidence: number;
    }) {
      return database
        .insert(categoryMap)
        .values({
          userId: input.userId,
          userCategoryId: input.userCategoryId,
          taxonomyNodeId: input.taxonomyNodeId,
          source: input.source,
          confidence: input.confidence.toFixed(3),
        })
        .onConflictDoUpdate({
          target: categoryMap.userCategoryId,
          set: {
            taxonomyNodeId: input.taxonomyNodeId,
            source: input.source,
            confidence: input.confidence.toFixed(3),
            updatedAt: new Date(),
          },
        })
        .returning()
        .then(([row]) => row);
    },

    /** Only overwrite a SEED/MODEL mapping — never clobber a USER-confirmed one. */
    upsertIfNotUserSet(input: {
      userId: string;
      userCategoryId: string;
      taxonomyNodeId: string;
      source: CategoryMapSource;
      confidence: number;
    }) {
      return database.transaction(async (tx) => {
        const [existing] = await tx
          .select({ source: categoryMap.source })
          .from(categoryMap)
          .where(eq(categoryMap.userCategoryId, input.userCategoryId))
          .limit(1);
        if (existing?.source === "USER") return existing;
        return tx
          .insert(categoryMap)
          .values({
            userId: input.userId,
            userCategoryId: input.userCategoryId,
            taxonomyNodeId: input.taxonomyNodeId,
            source: input.source,
            confidence: input.confidence.toFixed(3),
          })
          .onConflictDoUpdate({
            target: categoryMap.userCategoryId,
            set: { taxonomyNodeId: input.taxonomyNodeId, source: input.source, confidence: input.confidence.toFixed(3), updatedAt: new Date() },
          })
          .returning()
          .then(([row]) => row);
      });
    },

    /** Reverse lookup: which of this user's categories maps to a canonical node. */
    findUserCategoryForNode(taxonomyNodeId: string, userId: string) {
      return database
        .select({ userCategoryId: categoryMap.userCategoryId, confidence: categoryMap.confidence })
        .from(categoryMap)
        .where(and(eq(categoryMap.taxonomyNodeId, taxonomyNodeId), eq(categoryMap.userId, userId)))
        .orderBy(desc(categoryMap.confidence))
        .limit(1)
        .then(([row]) => row);
    },

    resolveNodeForUserCategory(userCategoryId: string, userId: string) {
      return database
        .select({ node: categoryTaxonomy })
        .from(categoryMap)
        .innerJoin(categoryTaxonomy, eq(categoryTaxonomy.id, categoryMap.taxonomyNodeId))
        .where(and(eq(categoryMap.userCategoryId, userCategoryId), eq(categoryMap.userId, userId)))
        .limit(1)
        .then(([row]) => row?.node);
    },
  };
}
