import { and, eq, sql } from "drizzle-orm";

import type { Database } from "../client";
import { promotionAccessPeriods, promotionalAccessGrants, promotionCodes, promotionRedemptions } from "../schema";

// Postgres unique_violation SQLSTATE — used as the concurrency backstop when two different
// promotion codes are redeemed by the same user at the same instant (each redemption locks only
// its own code row, so the two transactions don't serialize against each other; the partial
// unique index on promotional_access_grants(user_id) WHERE status='ACTIVE' is what actually
// prevents the double-active-grant race, and this is how the repository detects it).
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === UNIQUE_VIOLATION;
}

export function createPromotionRepository(database: Database) {
  return {
    findByNormalizedCode(normalizedCode: string) {
      return database.select().from(promotionCodes).where(eq(promotionCodes.normalizedCode, normalizedCode)).limit(1).then(([code]) => code);
    },

    findById(codeId: string) {
      return database.select().from(promotionCodes).where(eq(promotionCodes.id, codeId)).limit(1).then(([code]) => code);
    },

    listAll() {
      return database.select().from(promotionCodes);
    },

    create(input: {
      code: string;
      normalizedCode: string;
      name: string;
      description: string | null;
      durationValue: number;
      durationUnit: "DAYS";
      redemptionStartsAt: Date | null;
      redemptionEndsAt: Date | null;
      maxRedemptions: number | null;
      maxRedemptionsPerUser: number;
      stackingPolicy: "NOT_STACKABLE";
      aiCreditsPerPeriod: number;
      whatsappMessagesPerPeriod: number;
      createdBy: string;
    }) {
      return database.insert(promotionCodes).values(input).returning().then(([code]) => code);
    },

    update(codeId: string, input: {
      name?: string;
      description?: string | null;
      redemptionStartsAt?: Date | null;
      redemptionEndsAt?: Date | null;
      maxRedemptions?: number | null;
      maxRedemptionsPerUser?: number;
    }) {
      return database.update(promotionCodes)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(promotionCodes.id, codeId))
        .returning()
        .then(([code]) => code);
    },

    setStatus(codeId: string, status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "REVOKED") {
      return database.update(promotionCodes)
        .set({ status, updatedAt: new Date() })
        .where(eq(promotionCodes.id, codeId))
        .returning()
        .then(([code]) => code);
    },

    findGrantById(grantId: string) {
      return database.select().from(promotionalAccessGrants).where(eq(promotionalAccessGrants.id, grantId)).limit(1).then(([grant]) => grant);
    },

    findActiveGrantForUser(userId: string) {
      return database.select().from(promotionalAccessGrants)
        .where(and(eq(promotionalAccessGrants.userId, userId), eq(promotionalAccessGrants.status, "ACTIVE")))
        .limit(1)
        .then(([grant]) => grant);
    },

    // Any status (ACTIVE/EXPIRED/REVOKED) — used only to answer "has this user ever had a
    // promotional grant at all" (TASK-064's NO_ACCESS-vs-EXPIRED_READ_ONLY distinction), never
    // to resolve current access.
    hasAnyGrantForUser(userId: string) {
      return database.select({ id: promotionalAccessGrants.id }).from(promotionalAccessGrants)
        .where(eq(promotionalAccessGrants.userId, userId))
        .limit(1)
        .then((rows) => rows.length > 0);
    },

    revokeGrant(grantId: string, input: { revokedBy: string; revocationReason: string | null; revokedAt: Date }) {
      return database.update(promotionalAccessGrants)
        .set({ status: "REVOKED", revokedAt: input.revokedAt, revokedBy: input.revokedBy, revocationReason: input.revocationReason, updatedAt: new Date() })
        .where(and(eq(promotionalAccessGrants.id, grantId), eq(promotionalAccessGrants.status, "ACTIVE")))
        .returning()
        .then(([grant]) => grant);
    },

    extendGrant(grantId: string, input: { endsAt: Date }) {
      return database.update(promotionalAccessGrants)
        .set({ endsAt: input.endsAt, updatedAt: new Date() })
        .where(eq(promotionalAccessGrants.id, grantId))
        .returning()
        .then(([grant]) => grant);
    },

    // The single atomic redemption transaction — see RedeemPromotionCodeRepository's contract
    // in @know-finanzas/promotions for why `decide` is injected rather than duplicated here.
    async redeemCode(input: {
      normalizedCode: string;
      userId: string;
      decide: (context: { code: typeof promotionCodes.$inferSelect; userRedemptionCount: number; hasActiveGrant: boolean }) => (
        | { ok: true; startsAt: Date; endsAt: Date; periods: Array<{ sequence: number; startsAt: Date; endsAt: Date }> }
        | { ok: false; reason: string }
      );
    }) {
      // Postgres aborts the whole transaction on the first error — catching mid-transaction and
      // continuing to issue queries (including the implicit COMMIT) just re-raises the same
      // error. The catch has to wrap the transaction call itself, after the driver has already
      // rolled back, not sit inside the callback.
      try {
        return await database.transaction(async (tx) => {
          const [code] = await tx.select().from(promotionCodes).where(eq(promotionCodes.normalizedCode, input.normalizedCode)).for("update");
          if (!code) return { outcome: "not_found" as const };

          const [userRedemptionCountRow] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(promotionRedemptions)
            .where(and(eq(promotionRedemptions.promotionCodeId, code.id), eq(promotionRedemptions.userId, input.userId), eq(promotionRedemptions.status, "REDEEMED")));
          const userRedemptionCount = userRedemptionCountRow?.count ?? 0;

          const [existingActiveGrant] = await tx.select({ id: promotionalAccessGrants.id }).from(promotionalAccessGrants)
            .where(and(eq(promotionalAccessGrants.userId, input.userId), eq(promotionalAccessGrants.status, "ACTIVE")))
            .limit(1);

          const decision = input.decide({ code, userRedemptionCount, hasActiveGrant: Boolean(existingActiveGrant) });
          if (!decision.ok) return { outcome: "rejected" as const, reason: decision.reason };

          const [redemption] = await tx.insert(promotionRedemptions).values({
            promotionCodeId: code.id,
            userId: input.userId,
            status: "REDEEMED",
          }).returning();

          const [grant] = await tx.insert(promotionalAccessGrants).values({
            userId: input.userId,
            promotionCodeId: code.id,
            redemptionId: redemption.id,
            accessLevel: code.accessLevel,
            startsAt: decision.startsAt,
            endsAt: decision.endsAt,
            status: "ACTIVE",
            source: "CODE_REDEMPTION",
            aiCreditsPerPeriod: code.aiCreditsPerPeriod,
            whatsappMessagesPerPeriod: code.whatsappMessagesPerPeriod,
          }).returning();

          const [updatedRedemption] = await tx.update(promotionRedemptions)
            .set({ grantId: grant.id })
            .where(eq(promotionRedemptions.id, redemption.id))
            .returning();

          const periods = decision.periods.length > 0
            ? await tx.insert(promotionAccessPeriods).values(decision.periods.map((period) => ({
                grantId: grant.id,
                sequence: period.sequence,
                startsAt: period.startsAt,
                endsAt: period.endsAt,
                status: "ACTIVE" as const,
              }))).returning()
            : [];

          await tx.update(promotionCodes)
            .set({ redemptionCount: sql`${promotionCodes.redemptionCount} + 1`, updatedAt: new Date() })
            .where(eq(promotionCodes.id, code.id));

          return { outcome: "redeemed" as const, redemption: updatedRedemption, grant, periods };
        });
      } catch (error) {
        if (isUniqueViolation(error)) return { outcome: "rejected" as const, reason: "PROMOTION_ALREADY_ACTIVE" };
        throw error;
      }
    },

    // Admin-only manual grant path (ADMIN_OVERRIDE/MANUAL_PROMOTION) — never touches
    // promotion_codes/promotion_redemptions, relies on the same partial-unique-index backstop
    // for the "at most one ACTIVE grant per user" invariant.
    async createManualGrant(input: {
      userId: string;
      source: "ADMIN_OVERRIDE" | "MANUAL_PROMOTION" | "REFERRAL_REWARD";
      startsAt: Date;
      endsAt: Date;
      aiCreditsPerPeriod: number;
      whatsappMessagesPerPeriod: number;
      periods: Array<{ sequence: number; startsAt: Date; endsAt: Date }>;
    }) {
      // Same rule as redeemCode: catch outside the transaction, after any rollback already
      // happened, not inside the callback (see the comment there).
      try {
        return await database.transaction(async (tx) => {
          const [grant] = await tx.insert(promotionalAccessGrants).values({
            userId: input.userId,
            promotionCodeId: null,
            redemptionId: null,
            accessLevel: "PRO",
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            status: "ACTIVE",
            source: input.source,
            aiCreditsPerPeriod: input.aiCreditsPerPeriod,
            whatsappMessagesPerPeriod: input.whatsappMessagesPerPeriod,
          }).returning();

          const periods = input.periods.length > 0
            ? await tx.insert(promotionAccessPeriods).values(input.periods.map((period) => ({
                grantId: grant.id,
                sequence: period.sequence,
                startsAt: period.startsAt,
                endsAt: period.endsAt,
                status: "ACTIVE" as const,
              }))).returning()
            : [];

          return { grant, periods };
        });
      } catch (error) {
        if (isUniqueViolation(error)) return { alreadyActive: true as const };
        throw error;
      }
    },
  };
}
