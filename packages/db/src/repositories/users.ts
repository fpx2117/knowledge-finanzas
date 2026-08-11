import { and, eq, ilike, isNull } from "drizzle-orm";

import type { Database } from "../client";
import { users } from "../schema";

export function createUserRepository(database: Database) {
  return {
    findById(userId: string) {
      return database.select().from(users).where(eq(users.id, userId)).limit(1).then(([user]) => user);
    },

    // Prefix match only (never a broad substring/contains search) — Security Requirement:
    // "does not support unrestricted broad queries/export by default."
    searchByEmailPrefix(prefix: string, limit: number) {
      return database.select().from(users).where(ilike(users.email, `${prefix}%`)).limit(limit);
    },

    // Minimal, product-access-focused projection: the gate only needs trial dates, not the
    // full user row.
    findAccessInputById(userId: string) {
      return database.select({ id: users.id, trialStartedAt: users.trialStartedAt, trialEndsAt: users.trialEndsAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(([user]) => user);
    },

    findTimezoneById(userId: string) {
      return database.select({ timezone: users.timezone })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(([user]) => user?.timezone);
    },

    findEmailById(userId: string) {
      return database.select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(([user]) => user?.email);
    },

    // The onboarding basic-profile step (TASK-063) — only ever writes account configuration
    // (name/country/timezone/baseCurrency/language), never financial data.
    updateBasicProfile(userId: string, input: { name?: string; country?: string | null; timezone?: string; baseCurrency?: string; language?: string | null }) {
      return database.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning()
        .then(([user]) => user);
    },

    // Atomic, idempotent trial start (TASK-064's StartTrial): the WHERE clause is what makes a
    // concurrent double-submit only ever let ONE of the two UPDATEs actually set the dates — the
    // loser gets 0 rows back and the caller falls back to re-reading the (now-set-by-the-winner)
    // row, never a second grant.
    async startTrialIfNeverStarted(userId: string, input: { trialStartedAt: Date; trialEndsAt: Date }): Promise<{ trialStartedAt: Date; trialEndsAt: Date; wasJustStarted: boolean }> {
      const [updated] = await database.update(users)
        .set({ trialStartedAt: input.trialStartedAt, trialEndsAt: input.trialEndsAt, updatedAt: new Date() })
        .where(and(eq(users.id, userId), isNull(users.trialStartedAt)))
        .returning({ trialStartedAt: users.trialStartedAt, trialEndsAt: users.trialEndsAt });

      if (updated) return { trialStartedAt: updated.trialStartedAt!, trialEndsAt: updated.trialEndsAt!, wasJustStarted: true };

      const [existing] = await database.select({ trialStartedAt: users.trialStartedAt, trialEndsAt: users.trialEndsAt }).from(users).where(eq(users.id, userId)).limit(1);
      return { trialStartedAt: existing.trialStartedAt ?? input.trialStartedAt, trialEndsAt: existing.trialEndsAt ?? input.trialEndsAt, wasJustStarted: false };
    },
  };
}
