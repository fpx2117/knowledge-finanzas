import { and, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";

import type { Database } from "../client";
import { kaiNotificationMutes, kaiNotifications } from "../schema";

export type KaiNotificationCandidateInput = {
  userId: string;
  kind: string;
  dedupKey: string;
  priority: number;
  payload: unknown;
  expiresAt: Date | null;
};

export type KaiDeliveryStateRow = {
  /** dedupKeys the user dismissed or acted on — never show again (this period). */
  resolvedDedupKeys: string[];
  /** Snoozed: hidden until `until`. */
  snoozed: { dedupKey: string; until: string }[];
  /** Message kinds the user muted ("no mostrarme este tipo"). */
  mutedKinds: string[];
  /** How many proactive cards were shown since `since` (frequency cap). */
  shownSinceCount: number;
  /** When the last card was shown, ISO, or null. */
  lastShownAt: string | null;
};

export function createKaiNotificationRepository(database: Database) {
  return {
    /** First time a condition fires → create a PENDING row. No-op if we already have this dedupKey. */
    async recordCandidate(input: KaiNotificationCandidateInput): Promise<void> {
      await database
        .insert(kaiNotifications)
        .values({
          userId: input.userId,
          kind: input.kind,
          dedupKey: input.dedupKey,
          priority: input.priority,
          payload: input.payload as never,
          expiresAt: input.expiresAt,
        })
        .onConflictDoNothing({ target: [kaiNotifications.userId, kaiNotifications.dedupKey] });
    },

    async getDeliveryState(userId: string, since: Date, now: Date): Promise<KaiDeliveryStateRow> {
      const [rows, mutes] = await Promise.all([
        database
          .select({
            dedupKey: kaiNotifications.dedupKey,
            state: kaiNotifications.state,
            snoozedUntil: kaiNotifications.snoozedUntil,
            shownAt: kaiNotifications.shownAt,
          })
          .from(kaiNotifications)
          .where(eq(kaiNotifications.userId, userId)),
        database
          .select({ kind: kaiNotificationMutes.kind })
          .from(kaiNotificationMutes)
          .where(eq(kaiNotificationMutes.userId, userId)),
      ]);

      const resolvedDedupKeys: string[] = [];
      const snoozed: { dedupKey: string; until: string }[] = [];
      let shownSinceCount = 0;
      let lastShownAt: string | null = null;

      for (const row of rows) {
        if (row.state === "DISMISSED" || row.state === "ACTED") resolvedDedupKeys.push(row.dedupKey);
        if (row.state === "SNOOZED" && row.snoozedUntil && row.snoozedUntil > now) {
          snoozed.push({ dedupKey: row.dedupKey, until: row.snoozedUntil.toISOString() });
        }
        if (row.shownAt) {
          if (row.shownAt >= since) shownSinceCount += 1;
          if (!lastShownAt || row.shownAt.toISOString() > lastShownAt) lastShownAt = row.shownAt.toISOString();
        }
      }

      return { resolvedDedupKeys, snoozed, mutedKinds: mutes.map((m) => m.kind), shownSinceCount, lastShownAt };
    },

    async markShown(userId: string, dedupKey: string, now: Date): Promise<void> {
      await database
        .update(kaiNotifications)
        .set({ state: "SHOWN", shownAt: now, updatedAt: now })
        .where(
          and(
            eq(kaiNotifications.userId, userId),
            eq(kaiNotifications.dedupKey, dedupKey),
            inArray(kaiNotifications.state, ["PENDING", "SHOWN"]),
          ),
        );
    },

    async setState(
      userId: string,
      dedupKey: string,
      state: "DISMISSED" | "ACTED" | "SNOOZED",
      now: Date,
      snoozedUntil?: Date,
    ): Promise<void> {
      await database
        .update(kaiNotifications)
        .set({
          state,
          updatedAt: now,
          ...(state === "DISMISSED" ? { dismissedAt: now } : {}),
          ...(state === "ACTED" ? { actionTakenAt: now } : {}),
          ...(state === "SNOOZED" ? { snoozedUntil: snoozedUntil ?? now } : {}),
        })
        .where(and(eq(kaiNotifications.userId, userId), eq(kaiNotifications.dedupKey, dedupKey)));
    },

    async mute(userId: string, kind: string): Promise<void> {
      await database
        .insert(kaiNotificationMutes)
        .values({ userId, kind })
        .onConflictDoNothing({ target: [kaiNotificationMutes.userId, kaiNotificationMutes.kind] });
    },

    /** Reactivate SNOOZED rows whose snooze window has passed. */
    async wakeSnoozed(userId: string, now: Date): Promise<void> {
      await database
        .update(kaiNotifications)
        .set({ state: "PENDING", snoozedUntil: null, updatedAt: now })
        .where(
          and(
            eq(kaiNotifications.userId, userId),
            eq(kaiNotifications.state, "SNOOZED"),
            sql`${kaiNotifications.snoozedUntil} <= ${now}`,
          ),
        );
    },

    listForUser(userId: string, limit: number) {
      return database
        .select()
        .from(kaiNotifications)
        .where(eq(kaiNotifications.userId, userId))
        .orderBy(desc(kaiNotifications.createdAt))
        .limit(limit);
    },

    /** Sanity helpers for tests / a future admin view. */
    countShownSince(userId: string, since: Date) {
      return database
        .select({ n: sql<number>`count(*)::int` })
        .from(kaiNotifications)
        .where(and(eq(kaiNotifications.userId, userId), gte(kaiNotifications.shownAt, since)))
        .then(([r]) => r?.n ?? 0);
    },

    activeSnoozeCount(userId: string, now: Date) {
      return database
        .select({ n: sql<number>`count(*)::int` })
        .from(kaiNotifications)
        .where(
          and(
            eq(kaiNotifications.userId, userId),
            eq(kaiNotifications.state, "SNOOZED"),
            gt(kaiNotifications.snoozedUntil, now),
          ),
        )
        .then(([r]) => r?.n ?? 0);
    },
  };
}

export type KaiNotificationRepository = ReturnType<typeof createKaiNotificationRepository>;
