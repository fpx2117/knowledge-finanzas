import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { userOnboarding } from "../schema";

export function createOnboardingRepository(database: Database) {
  return {
    findForUser(userId: string) {
      return database.select().from(userOnboarding).where(eq(userOnboarding.userId, userId)).limit(1).then(([row]) => row);
    },

    // One row per user, upserted in place — status/currentStep transitions are overwritten, not
    // historized (unlike analytics_consent_history, which the privacy pipeline explicitly needs
    // an audit trail for; onboarding progress doesn't).
    upsertForUser(userId: string, input: { version: string; status: string; currentStep: string; startedAt?: Date | null; completedAt?: Date | null }) {
      return database.insert(userOnboarding)
        .values({ userId, ...input, updatedAt: new Date() })
        .onConflictDoUpdate({ target: userOnboarding.userId, set: { ...input, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },
  };
}
