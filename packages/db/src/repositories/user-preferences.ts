import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { userPreferences } from "../schema";

export type UserPreferences = typeof userPreferences.$inferSelect;

export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, "userId" | "updatedAt"> = {
  theme: "SYSTEM",
  defaultReportPeriod: "THIS_MONTH",
  weekStartsOn: 1,
  showCents: true,
  compactLargeNumbers: true,
  rememberLastAccount: true,
  rememberLastCategory: true,
  captureMode: "QUICK",
};

export function createUserPreferencesRepository(database: Database) {
  return {
    async getForUser(userId: string): Promise<Omit<UserPreferences, "userId" | "updatedAt">> {
      const [row] = await database.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
      if (!row) return { ...DEFAULT_USER_PREFERENCES };
      const { userId: _u, updatedAt: _t, ...prefs } = row;
      return prefs;
    },

    upsert(userId: string, input: Partial<Omit<UserPreferences, "userId" | "updatedAt">>) {
      return database
        .insert(userPreferences)
        .values({ userId, ...input })
        .onConflictDoUpdate({ target: userPreferences.userId, set: { ...input, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },
  };
}
