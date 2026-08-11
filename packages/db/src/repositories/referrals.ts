import { and, count, desc, eq, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database } from "../client";
import { referralAttributions, referralCodes, referralRewards, users } from "../schema";

const referrerUsers = alias(users, "referrer_users");
const referredUsers = alias(users, "referred_users");

// Postgres unique_violation SQLSTATE — used as the concurrency backstop for the
// one-attribution-per-referred-user and one-reward-per-attribution-event-beneficiary indexes.
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === UNIQUE_VIOLATION;
}

export function createReferralRepository(database: Database) {
  return {
    findActiveCodeByOwner(ownerUserId: string) {
      return database.select().from(referralCodes)
        .where(and(eq(referralCodes.ownerUserId, ownerUserId), eq(referralCodes.status, "ACTIVE")))
        .limit(1)
        .then(([code]) => code);
    },

    findActiveCodeByCode(code: string) {
      return database.select().from(referralCodes)
        .where(and(eq(referralCodes.code, code), eq(referralCodes.status, "ACTIVE")))
        .limit(1)
        .then(([row]) => row);
    },

    createCode(input: { ownerUserId: string; code: string }) {
      return database.insert(referralCodes).values({ ownerUserId: input.ownerUserId, code: input.code }).returning().then(([created]) => created);
    },

    findAttributionByReferredUser(referredUserId: string) {
      return database.select().from(referralAttributions).where(eq(referralAttributions.referredUserId, referredUserId)).limit(1).then(([row]) => row);
    },

    findAttributionById(attributionId: string) {
      return database.select().from(referralAttributions).where(eq(referralAttributions.id, attributionId)).limit(1).then(([row]) => row);
    },

    async createAttribution(input: { referralCodeId: string; referrerUserId: string; referredUserId: string }) {
      try {
        const [attribution] = await database.insert(referralAttributions).values({
          referralCodeId: input.referralCodeId,
          referrerUserId: input.referrerUserId,
          referredUserId: input.referredUserId,
        }).returning();
        return attribution;
      } catch (error) {
        if (isUniqueViolation(error)) {
          const [existing] = await database.select().from(referralAttributions).where(eq(referralAttributions.referredUserId, input.referredUserId)).limit(1);
          if (existing) return existing;
        }
        throw error;
      }
    },

    markConverted(input: { attributionId: string; convertedAt: Date }) {
      return database.update(referralAttributions)
        .set({ status: "CONVERTED", convertedAt: input.convertedAt })
        .where(eq(referralAttributions.id, input.attributionId))
        .returning()
        .then(([row]) => row);
    },

    markInvalidated(input: { attributionId: string; invalidatedBy: string; invalidationReason: string; invalidatedAt: Date }) {
      return database.update(referralAttributions)
        .set({
          status: "INVALIDATED",
          invalidatedAt: input.invalidatedAt,
          invalidatedBy: input.invalidatedBy,
          invalidationReason: input.invalidationReason,
        })
        .where(eq(referralAttributions.id, input.attributionId))
        .returning()
        .then(([row]) => row);
    },

    async countRewardsGrantedToBeneficiarySince(input: { beneficiaryUserId: string; since: Date }) {
      const [row] = await database.select({ value: count() }).from(referralRewards)
        .where(and(
          eq(referralRewards.beneficiaryUserId, input.beneficiaryUserId),
          eq(referralRewards.status, "GRANTED"),
          gte(referralRewards.createdAt, input.since),
        ));
      return row?.value ?? 0;
    },

    // Idempotent on the (referralAttributionId, qualificationEvent, beneficiaryUserId) unique
    // constraint — a second call for the same attribution returns the existing row instead of
    // throwing.
    async createPendingReward(input: {
      referralAttributionId: string;
      beneficiaryUserId: string;
      type: "PROMOTIONAL_PRO_DAYS" | "AI_CREDITS";
      value: number;
      rewardPolicyVersion: string;
    }) {
      try {
        const [reward] = await database.insert(referralRewards).values({
          referralAttributionId: input.referralAttributionId,
          beneficiaryUserId: input.beneficiaryUserId,
          type: input.type,
          value: input.value,
          rewardPolicyVersion: input.rewardPolicyVersion,
        }).returning();
        return reward;
      } catch (error) {
        if (isUniqueViolation(error)) {
          const [existing] = await database.select().from(referralRewards)
            .where(and(
              eq(referralRewards.referralAttributionId, input.referralAttributionId),
              eq(referralRewards.beneficiaryUserId, input.beneficiaryUserId),
            ))
            .limit(1);
          if (existing) return existing;
        }
        throw error;
      }
    },

    findRewardById(rewardId: string) {
      return database.select().from(referralRewards).where(eq(referralRewards.id, rewardId)).limit(1).then(([row]) => row);
    },

    markGranted(input: { rewardId: string; grantReferenceId: string; grantedAt: Date }) {
      return database.update(referralRewards)
        .set({ status: "GRANTED", grantReferenceId: input.grantReferenceId, grantedAt: input.grantedAt, failureReason: null })
        .where(eq(referralRewards.id, input.rewardId))
        .returning()
        .then(([row]) => row);
    },

    markFailed(input: { rewardId: string; failureReason: string }) {
      return database.update(referralRewards)
        .set({ status: "FAILED", failureReason: input.failureReason })
        .where(eq(referralRewards.id, input.rewardId))
        .returning()
        .then(([row]) => row);
    },

    // Privacy-safe by construction: no referred-user identity column is selected here — the
    // referrer's own summary page only ever gets ordinal invitations (Security Requirement:
    // "never exposes the referred user's email or financial data").
    listAttributionsForReferrer(referrerUserId: string) {
      return database
        .select({ attribution: referralAttributions, reward: referralRewards })
        .from(referralAttributions)
        .leftJoin(referralRewards, eq(referralRewards.referralAttributionId, referralAttributions.id))
        .where(eq(referralAttributions.referrerUserId, referrerUserId))
        .orderBy(referralAttributions.attributedAt);
    },

    // Admin-only projection — identifies both sides by email for traceability (the admin
    // permission gating this page, commercial.users.read, already grants that visibility
    // elsewhere in /admin/users).
    listAllAttributionsForAdmin() {
      return database
        .select({
          attribution: referralAttributions,
          reward: referralRewards,
          referrerEmail: referrerUsers.email,
          referredEmail: referredUsers.email,
        })
        .from(referralAttributions)
        .leftJoin(referralRewards, eq(referralRewards.referralAttributionId, referralAttributions.id))
        .innerJoin(referrerUsers, eq(referrerUsers.id, referralAttributions.referrerUserId))
        .innerJoin(referredUsers, eq(referredUsers.id, referralAttributions.referredUserId))
        .orderBy(desc(referralAttributions.attributedAt));
    },
  };
}
