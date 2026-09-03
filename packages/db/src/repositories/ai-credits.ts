import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

import type { Database } from "../client";
import { aiCreditEntries, aiCreditReservations, type AICreditEntry, type AICreditReservation } from "../schema";

const CREDIT_ENTRY_TYPES = ["TRIAL_GRANT", "PLAN_GRANT", "PURCHASE_GRANT", "REFUND", "PROMOTIONAL_GRANT", "ADMIN_CREDIT_ADJUSTMENT", "REFERRAL_REWARD_GRANT"] as const;
const DEBIT_ENTRY_TYPES = ["CONSUMPTION", "EXPIRATION", "ADMIN_DEBIT_ADJUSTMENT"] as const;

export type AICreditPool = "TRIAL_ALLOWANCE" | "PLAN_ALLOWANCE" | "PURCHASED";
export type PoolBalances = Record<AICreditPool, number>;

const ZERO_BALANCES: PoolBalances = { TRIAL_ALLOWANCE: 0, PLAN_ALLOWANCE: 0, PURCHASED: 0 };

// Accepts either the top-level Database or a transaction handle from database.transaction(...).
type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

// Ledger balance is signed by entry type: grants/refunds add, consumption/expiration subtract.
// This is the settled balance — it does not account for PENDING reservations holding credits.
async function ledgerBalanceByPool(tx: Executor, userId: string): Promise<PoolBalances> {
  const rows = await tx
    .select({
      pool: aiCreditEntries.pool,
      balance: sql<string>`coalesce(sum(case
        when ${aiCreditEntries.type} in ${CREDIT_ENTRY_TYPES} then ${aiCreditEntries.amount}
        when ${aiCreditEntries.type} in ${DEBIT_ENTRY_TYPES} then -${aiCreditEntries.amount}
        else 0
      end), 0)`,
    })
    .from(aiCreditEntries)
    .where(eq(aiCreditEntries.userId, userId))
    .groupBy(aiCreditEntries.pool);

  const balances = { ...ZERO_BALANCES };
  for (const row of rows) balances[row.pool] = Number(row.balance);
  return balances;
}

async function pendingHoldsByPool(tx: Executor, userId: string): Promise<PoolBalances> {
  const rows = await tx
    .select({ pool: aiCreditReservations.pool, held: sql<string>`coalesce(sum(${aiCreditReservations.credits}), 0)` })
    .from(aiCreditReservations)
    .where(and(eq(aiCreditReservations.userId, userId), eq(aiCreditReservations.status, "PENDING")))
    .groupBy(aiCreditReservations.pool);

  const holds = { ...ZERO_BALANCES };
  for (const row of rows) holds[row.pool] = Number(row.held);
  return holds;
}

export function createAICreditRepository(database: Database) {
  return {
    async insertEntry(input: {
      userId: string;
      type: AICreditEntry["type"];
      pool: AICreditPool;
      amount: number;
      capability?: string | null;
      referenceId?: string | null;
      periodKey?: string | null;
      expiresAt?: Date | null;
      metadata?: unknown;
    }) {
      const [entry] = await database.insert(aiCreditEntries).values(input).returning();
      return entry;
    },

    // Idempotent: at most one TRIAL_GRANT per user, ever (ai_credit_entries_trial_grant_unique).
    async grantTrialCredits(input: { userId: string; amount: number; expiresAt: Date | null }): Promise<{ created: boolean; entry: AICreditEntry | undefined }> {
      const [entry] = await database.insert(aiCreditEntries).values({
        userId: input.userId,
        type: "TRIAL_GRANT",
        pool: "TRIAL_ALLOWANCE",
        amount: input.amount,
        expiresAt: input.expiresAt,
      }).onConflictDoNothing({ target: [aiCreditEntries.userId], where: sql`${aiCreditEntries.type} = 'TRIAL_GRANT'` }).returning();

      if (entry) return { created: true, entry };
      const existing = await database.select().from(aiCreditEntries)
        .where(and(eq(aiCreditEntries.userId, input.userId), eq(aiCreditEntries.type, "TRIAL_GRANT")))
        .limit(1).then((rows) => rows[0]);
      return { created: false, entry: existing };
    },

    // Idempotent per (userId, referenceId=billingPeriodId): PLAN_GRANT fires exactly once per
    // billing period (ai_credit_entries_plan_grant_unique).
    async grantPlanCredits(input: { userId: string; amount: number; referenceId: string; periodKey?: string | null; expiresAt: Date | null }): Promise<{ created: boolean; entry: AICreditEntry | undefined }> {
      const [entry] = await database.insert(aiCreditEntries).values({
        userId: input.userId,
        type: "PLAN_GRANT",
        pool: "PLAN_ALLOWANCE",
        amount: input.amount,
        referenceId: input.referenceId,
        periodKey: input.periodKey,
        expiresAt: input.expiresAt,
      }).onConflictDoNothing({ target: [aiCreditEntries.userId, aiCreditEntries.referenceId], where: sql`${aiCreditEntries.type} = 'PLAN_GRANT'` }).returning();

      if (entry) return { created: true, entry };
      const existing = await database.select().from(aiCreditEntries)
        .where(and(eq(aiCreditEntries.userId, input.userId), eq(aiCreditEntries.type, "PLAN_GRANT"), eq(aiCreditEntries.referenceId, input.referenceId)))
        .limit(1).then((rows) => rows[0]);
      return { created: false, entry: existing };
    },

    async getAvailableBalances(userId: string): Promise<PoolBalances> {
      const [ledger, held] = await Promise.all([ledgerBalanceByPool(database, userId), pendingHoldsByPool(database, userId)]);
      return {
        TRIAL_ALLOWANCE: ledger.TRIAL_ALLOWANCE - held.TRIAL_ALLOWANCE,
        PLAN_ALLOWANCE: ledger.PLAN_ALLOWANCE - held.PLAN_ALLOWANCE,
        PURCHASED: ledger.PURCHASED - held.PURCHASED,
      };
    },

    // Idempotent per (userId, referenceId=referralRewardId): a repeated grant attempt (e.g. an
    // admin retry after a transient failure) never double-credits the same reward
    // (ai_credit_entries_referral_reward_grant_unique).
    async grantReferralRewardCredits(input: { userId: string; amount: number; referenceId: string }): Promise<{ created: boolean; entry: AICreditEntry | undefined }> {
      const [entry] = await database.insert(aiCreditEntries).values({
        userId: input.userId,
        type: "REFERRAL_REWARD_GRANT",
        pool: "PLAN_ALLOWANCE",
        amount: input.amount,
        referenceId: input.referenceId,
      }).onConflictDoNothing({ target: [aiCreditEntries.userId, aiCreditEntries.referenceId], where: sql`${aiCreditEntries.type} = 'REFERRAL_REWARD_GRANT'` }).returning();

      if (entry) return { created: true, entry };
      const existing = await database.select().from(aiCreditEntries)
        .where(and(eq(aiCreditEntries.userId, input.userId), eq(aiCreditEntries.type, "REFERRAL_REWARD_GRANT"), eq(aiCreditEntries.referenceId, input.referenceId)))
        .limit(1).then((rows) => rows[0]);
      return { created: false, entry: existing };
    },

    findByOperationId(operationId: string, userId: string) {
      return database.select().from(aiCreditReservations).where(and(
        eq(aiCreditReservations.operationId, operationId),
        eq(aiCreditReservations.userId, userId),
      ))
        .limit(1).then(([reservation]) => reservation);
    },

    // Admin usage-history view (TASK-060): never exposes raw AI prompts — this table only ever
    // stores credit ledger entries (type/pool/amount/capability), not prompt content.
    listForUser(userId: string, limit: number) {
      return database.select().from(aiCreditEntries)
        .where(eq(aiCreditEntries.userId, userId))
        .orderBy(desc(aiCreditEntries.createdAt))
        .limit(limit);
    },

    // Manual admin Add/Remove (TASK-060 Domain Rule: "AI Adjustment = Ledger Entry", never a
    // direct balance column mutation). Serializes per-user with the same advisory lock `reserve`
    // uses, so a concurrent debit adjustment can never observe a stale balance and drive it
    // negative — the negative-balance guard is enforced inside the same transaction as the insert.
    async adjustBalance(input: { userId: string; pool: AICreditPool; amount: number; direction: "CREDIT" | "DEBIT"; reason: string; adminUserId: string }): Promise<
      { ok: true; entry: AICreditEntry } | { ok: false; available: number }
    > {
      return database.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.userId}))`);

        if (input.direction === "DEBIT") {
          const [ledger, held] = await Promise.all([ledgerBalanceByPool(tx, input.userId), pendingHoldsByPool(tx, input.userId)]);
          const available = ledger[input.pool] - held[input.pool];
          if (available < input.amount) return { ok: false, available };
        }

        const [entry] = await tx.insert(aiCreditEntries).values({
          userId: input.userId,
          type: input.direction === "CREDIT" ? "ADMIN_CREDIT_ADJUSTMENT" : "ADMIN_DEBIT_ADJUSTMENT",
          pool: input.pool,
          amount: input.amount,
          capability: null,
          referenceId: null,
          metadata: { reason: input.reason, adminUserId: input.adminUserId },
        }).returning();

        return { ok: true, entry };
      });
    },

    // Concurrency-safe reservation: serializes per-user via a transaction-scoped advisory lock so
    // concurrent requests cannot both observe the same available balance and both succeed.
    async reserve(input: { userId: string; capability: string; pool: AICreditPool; credits: number; operationId: string; expiresAt: Date }): Promise<
      { allowed: true; reservation: AICreditReservation } | { allowed: false; available: number; existing?: AICreditReservation }
    > {
      return database.transaction(async (tx) => {
        const existing = await tx.select().from(aiCreditReservations).where(and(
          eq(aiCreditReservations.operationId, input.operationId),
          eq(aiCreditReservations.userId, input.userId),
        )).limit(1).then((rows) => rows[0]);
        if (existing) return { allowed: true, reservation: existing };

        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.userId}))`);

        const [ledger, held] = await Promise.all([ledgerBalanceByPool(tx, input.userId), pendingHoldsByPool(tx, input.userId)]);
        const available = ledger[input.pool] - held[input.pool];
        if (available < input.credits) return { allowed: false, available };

        const [reservation] = await tx.insert(aiCreditReservations).values({
          userId: input.userId,
          capability: input.capability,
          pool: input.pool,
          credits: input.credits,
          operationId: input.operationId,
          status: "PENDING",
          expiresAt: input.expiresAt,
        }).returning();

        return { allowed: true, reservation };
      });
    },

    async commit(reservationId: string, input: { referenceId?: string | null } = {}): Promise<AICreditReservation | undefined> {
      return database.transaction(async (tx) => {
        const [reservation] = await tx.select().from(aiCreditReservations).where(eq(aiCreditReservations.id, reservationId)).for("update");
        if (!reservation) return undefined;
        if (reservation.status !== "PENDING") return reservation;

        const [entry] = await tx.insert(aiCreditEntries).values({
          userId: reservation.userId,
          type: "CONSUMPTION",
          pool: reservation.pool,
          amount: reservation.credits,
          capability: reservation.capability,
          referenceId: input.referenceId ?? reservation.operationId,
        }).returning();

        const [updated] = await tx.update(aiCreditReservations)
          .set({ status: "COMMITTED", creditEntryId: entry.id, updatedAt: new Date() })
          .where(eq(aiCreditReservations.id, reservationId))
          .returning();

        return updated;
      });
    },

    async release(reservationId: string): Promise<AICreditReservation | undefined> {
      return database.transaction(async (tx) => {
        const [reservation] = await tx.select().from(aiCreditReservations).where(eq(aiCreditReservations.id, reservationId)).for("update");
        if (!reservation) return undefined;
        if (reservation.status !== "PENDING") return reservation;

        const [updated] = await tx.update(aiCreditReservations)
          .set({ status: "RELEASED", updatedAt: new Date() })
          .where(eq(aiCreditReservations.id, reservationId))
          .returning();

        return updated;
      });
    },

    listStalePending(now: Date) {
      return database.select().from(aiCreditReservations)
        .where(and(eq(aiCreditReservations.status, "PENDING"), lt(aiCreditReservations.expiresAt, now)));
    },

    async markExpired(reservationIds: string[]) {
      if (reservationIds.length === 0) return [];
      return database.update(aiCreditReservations)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(and(inArray(aiCreditReservations.id, reservationIds), eq(aiCreditReservations.status, "PENDING")))
        .returning();
    },
  };
}
