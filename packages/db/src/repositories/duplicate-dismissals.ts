import { and, eq } from "drizzle-orm";

import type { Database } from "../client";
import { duplicateDismissals } from "../schema";

/** Stable key for an unordered pair of transaction ids. */
export function duplicatePairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function createDuplicateDismissalRepository(database: Database) {
  return {
    listKeysForUser(userId: string) {
      return database
        .select({ pairKey: duplicateDismissals.pairKey })
        .from(duplicateDismissals)
        .where(eq(duplicateDismissals.userId, userId))
        .then((rows) => rows.map((r) => r.pairKey));
    },

    dismiss(userId: string, transactionIdA: string, transactionIdB: string) {
      return database
        .insert(duplicateDismissals)
        .values({ userId, pairKey: duplicatePairKey(transactionIdA, transactionIdB) })
        .onConflictDoNothing()
        .returning()
        .then(([row]) => row);
    },

    forget(userId: string, transactionIdA: string, transactionIdB: string) {
      return database
        .delete(duplicateDismissals)
        .where(and(
          eq(duplicateDismissals.userId, userId),
          eq(duplicateDismissals.pairKey, duplicatePairKey(transactionIdA, transactionIdB)),
        ))
        .returning();
    },
  };
}
