import { and, desc, eq, inArray, notInArray } from "drizzle-orm";

import type { Database } from "../client";
import { recurringSeries } from "../schema";

export type RecurringSeriesStatus = "SUGGESTED" | "CONFIRMED" | "DISMISSED";

export function createRecurringSeriesRepository(database: Database) {
  return {
    listForUser(userId: string, status?: RecurringSeriesStatus) {
      return database
        .select()
        .from(recurringSeries)
        .where(and(eq(recurringSeries.userId, userId), status ? eq(recurringSeries.status, status) : undefined))
        .orderBy(desc(recurringSeries.confidence), desc(recurringSeries.lastSeenOn));
    },

    /** Insert a detected series, or refresh an existing SUGGESTED one. Never touches CONFIRMED/DISMISSED. */
    upsertSuggested(input: {
      userId: string;
      merchantId: string | null;
      groupKey: string;
      label: string;
      frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
      typicalAmount: string;
      currencyCode: string;
      categoryId: string | null;
      occurrenceCount: number;
      confidence: number;
      lastSeenOn: string;
      nextExpectedOn: string;
    }) {
      return database
        .insert(recurringSeries)
        .values({
          userId: input.userId,
          merchantId: input.merchantId,
          groupKey: input.groupKey,
          label: input.label,
          frequency: input.frequency,
          typicalAmount: input.typicalAmount,
          currencyCode: input.currencyCode,
          categoryId: input.categoryId,
          occurrenceCount: input.occurrenceCount,
          confidence: input.confidence.toFixed(3),
          lastSeenOn: input.lastSeenOn,
          nextExpectedOn: input.nextExpectedOn,
        })
        .onConflictDoUpdate({
          target: [recurringSeries.userId, recurringSeries.groupKey, recurringSeries.currencyCode],
          set: {
            merchantId: input.merchantId,
            label: input.label,
            frequency: input.frequency,
            typicalAmount: input.typicalAmount,
            categoryId: input.categoryId,
            occurrenceCount: input.occurrenceCount,
            confidence: input.confidence.toFixed(3),
            lastSeenOn: input.lastSeenOn,
            nextExpectedOn: input.nextExpectedOn,
            updatedAt: new Date(),
          },
          setWhere: eq(recurringSeries.status, "SUGGESTED"),
        })
        .returning()
        .then(([row]) => row);
    },

    /** Drop SUGGESTED rows whose group is no longer detected (keeps CONFIRMED/DISMISSED). */
    pruneSuggested(userId: string, keepGroupKeys: string[]) {
      return database
        .delete(recurringSeries)
        .where(and(
          eq(recurringSeries.userId, userId),
          eq(recurringSeries.status, "SUGGESTED"),
          keepGroupKeys.length > 0 ? notInArray(recurringSeries.groupKey, keepGroupKeys) : undefined,
        ))
        .returning();
    },

    setStatusForUser(seriesId: string, userId: string, status: RecurringSeriesStatus) {
      return database
        .update(recurringSeries)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(recurringSeries.id, seriesId), eq(recurringSeries.userId, userId)))
        .returning()
        .then(([row]) => row);
    },

    dismissedGroupKeys(userId: string) {
      return database
        .select({ groupKey: recurringSeries.groupKey })
        .from(recurringSeries)
        .where(and(eq(recurringSeries.userId, userId), inArray(recurringSeries.status, ["DISMISSED", "CONFIRMED"])))
        .then((rows) => rows.map((r) => r.groupKey));
    },
  };
}
