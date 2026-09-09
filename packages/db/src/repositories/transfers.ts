import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Database } from "../client";
import { accounts, transactions, transfers } from "../schema";

export function createTransferRepository(database: Database) {
  /** The transfer aggregate for this user's idempotency key, or undefined. */
  async function findByCommandId(userId: string, commandId: string) {
    const [transfer] = await database
      .select()
      .from(transfers)
      .where(and(eq(transfers.userId, userId), eq(transfers.commandId, commandId)))
      .limit(1);
    if (!transfer) return undefined;
    const legs = await database
      .select()
      .from(transactions)
      .where(and(eq(transactions.transferId, transfer.id), eq(transactions.userId, userId)))
      .orderBy(asc(transactions.type));
    return { transfer, legs };
  }

  return {
    findByCommandId,

    async findAccountsForUserForUpdate(userId: string, fromAccountId: string, toAccountId: string) {
      const rows = await database.select({ id: accounts.id, userId: accounts.userId, currencyCode: accounts.currencyCode, status: accounts.status, openingDate: accounts.openingDate })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), inArray(accounts.id, [fromAccountId, toAccountId])))
        .orderBy(asc(accounts.id))
        .for("update");
      return { fromAccount: rows.find((row) => row.id === fromAccountId), toAccount: rows.find((row) => row.id === toAccountId) };
    },

    createShell(input: { id: string; userId: string; fromAccountId: string; toAccountId: string; amount: string; currencyCode: string; occurredAt: Date; notes: string | null; commandId?: string | null }) {
      return database.insert(transfers).values(input).returning().then(([transfer]) => transfer);
    },

    createLegPair(input: { outgoing: Record<string, unknown>; incoming: Record<string, unknown> }) {
      return database.insert(transactions).values([input.outgoing, input.incoming] as never).returning().then((rows) => {
        const outgoing = rows.find((row) => row.type === "TRANSFER_OUT");
        const incoming = rows.find((row) => row.type === "TRANSFER_IN");
        if (rows.length !== 2 || !outgoing || !incoming) throw new Error("Transfer must persist exactly two legs");
        return [outgoing, incoming] as const;
      });
    },

    async getAggregateForUser(transferId: string, userId: string, forUpdate = false) {
      const [transfer] = await database.select().from(transfers).where(and(eq(transfers.id, transferId), eq(transfers.userId, userId))).limit(1);
      if (!transfer) return undefined;
      const legsQuery = database.select().from(transactions).where(and(eq(transactions.transferId, transferId), eq(transactions.userId, userId))).orderBy(asc(transactions.type));
      const legs = forUpdate ? await legsQuery.for("update") : await legsQuery;
      return { transfer, legs };
    },

    listForUser(userId: string, options: { limit?: number; offset?: number } = {}) {
      return database.select().from(transfers).where(eq(transfers.userId, userId)).orderBy(asc(transfers.occurredAt)).limit(options.limit ?? 50).offset(options.offset ?? 0);
    },

    /** Every transfer for the user, newest first, with a `voided` flag (both legs voided). */
    async listForUserWithStatus(userId: string) {
      const rows = await database
        .select()
        .from(transfers)
        .where(eq(transfers.userId, userId))
        .orderBy(desc(transfers.occurredAt), desc(transfers.createdAt));
      if (rows.length === 0) return [];
      const legStatus = await database
        .select({
          transferId: transactions.transferId,
          anyPosted: sql<boolean>`bool_or(${transactions.status} = 'POSTED')`,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), isNotNull(transactions.transferId)))
        .groupBy(transactions.transferId);
      const posted = new Map(legStatus.map((row) => [row.transferId, row.anyPosted]));
      return rows.map((transfer) => ({ ...transfer, voided: posted.get(transfer.id) !== true }));
    },

    voidLegPair(transferId: string, userId: string, voidedAt: Date) {
      return database.update(transactions).set({ status: "VOIDED", voidedAt, updatedAt: voidedAt })
        .where(and(eq(transactions.transferId, transferId), eq(transactions.userId, userId), eq(transactions.status, "POSTED")))
        .returning().then((legs) => {
          if (legs.length !== 2) throw new Error("Transfer void must update exactly two legs");
          return legs;
        });
    },
  };
}
