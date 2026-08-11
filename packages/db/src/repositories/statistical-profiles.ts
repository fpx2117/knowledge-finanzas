import { count, eq, or, isNotNull } from "drizzle-orm";

import type { Database } from "../client";
import { userStatisticalProfiles } from "../schema";

export function createStatisticalProfileRepository(database: Database) {
  return {
    findForUser(userId: string) {
      return database.select().from(userStatisticalProfiles).where(eq(userStatisticalProfiles.userId, userId)).limit(1).then(([row]) => row);
    },

    // One row per user, upserted in place — profile fields are never versioned/historized
    // (unlike consent, which the task explicitly requires an append-only history for).
    upsertForUser(userId: string, input: {
      ageRange?: string | null;
      employmentStatus?: string | null;
      incomeRange?: string | null;
      householdSizeRange?: string | null;
      regionCode?: string | null;
    }) {
      return database.insert(userStatisticalProfiles)
        .values({ userId, ...input, updatedAt: new Date() })
        .onConflictDoUpdate({ target: userStatisticalProfiles.userId, set: { ...input, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },

    // Admin summary only (count, never a per-user field explorer) — "any field filled" counts a
    // profile as contributed regardless of which optional field(s) the user chose to answer.
    async countProfilesWithAnyFieldFilled() {
      const [row] = await database.select({ value: count() }).from(userStatisticalProfiles)
        .where(or(
          isNotNull(userStatisticalProfiles.ageRange),
          isNotNull(userStatisticalProfiles.employmentStatus),
          isNotNull(userStatisticalProfiles.incomeRange),
          isNotNull(userStatisticalProfiles.householdSizeRange),
          isNotNull(userStatisticalProfiles.regionCode),
        ));
      return row?.value ?? 0;
    },

    dismissPromptForUser(userId: string, dismissedAt: Date) {
      return database.insert(userStatisticalProfiles)
        .values({ userId, promptDismissedAt: dismissedAt, updatedAt: dismissedAt })
        .onConflictDoUpdate({ target: userStatisticalProfiles.userId, set: { promptDismissedAt: dismissedAt, updatedAt: dismissedAt } })
        .returning()
        .then(([row]) => row);
    },
  };
}
