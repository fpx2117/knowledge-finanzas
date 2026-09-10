import { and, asc, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { accounts, transactions } from "../schema";
import { buildLedgerTotalColumns } from "../queries/ledger-totals";

export function createAccountRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      name: string;
      type: "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
      institution?: string | null;
      currencyCode: string;
      isPrimary?: boolean;
      openingBalance: string;
      openingDate: string;
    }) {
      return database.transaction(async (tx) => {
        // First account for the user is primary by default; an explicit flag also wins.
        const hasPrimary = await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.userId, input.userId), eq(accounts.isPrimary, true)))
          .limit(1);
        const makePrimary = input.isPrimary === true || hasPrimary.length === 0;
        if (makePrimary && hasPrimary.length > 0) {
          await tx.update(accounts).set({ isPrimary: false }).where(eq(accounts.userId, input.userId));
        }
        const [account] = await tx
          .insert(accounts)
          .values({ ...input, isPrimary: makePrimary, status: "ACTIVE", archivedAt: null })
          .returning();
        return account;
      });
    },

    /** Make one account the user's primary; clears the flag on every other account. */
    async setPrimaryForUser(accountId: string, userId: string) {
      return database.transaction(async (tx) => {
        const [target] = await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")))
          .limit(1);
        if (!target) return undefined;
        await tx.update(accounts).set({ isPrimary: false, updatedAt: new Date() }).where(eq(accounts.userId, userId));
        const [account] = await tx
          .update(accounts)
          .set({ isPrimary: true, updatedAt: new Date() })
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
          .returning();
        return account;
      });
    },

    findByIdForUser(accountId: string, userId: string) {
      return database.select().from(accounts)
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
        .limit(1)
        .then(([account]) => account);
    },

    listForUser(userId: string, options: { includeArchived?: boolean } = {}) {
      return database.select().from(accounts)
        .where(options.includeArchived ? eq(accounts.userId, userId) : and(eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")))
        .orderBy(asc(accounts.name));
    },

    // Any status — used only as the "financial onboarding completed" signal (TASK-064's routing
    // guard: has this user ever created a first account, regardless of whether it's since been
    // archived), never for a real accounts listing.
    hasAnyForUser(userId: string) {
      return database.select({ id: accounts.id }).from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1)
        .then((rows) => rows.length > 0);
    },

    updateMetadataForUser(accountId: string, userId: string, input: { name: string }) {
      return database.update(accounts)
        .set({ name: input.name, updatedAt: new Date() })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")))
        .returning()
        .then(([account]) => account);
    },

    archiveForUser(accountId: string, userId: string, archivedAt: Date) {
      return database.update(accounts)
        .set({ status: "ARCHIVED", archivedAt, updatedAt: archivedAt })
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), eq(accounts.status, "ACTIVE")))
        .returning()
        .then(([account]) => account);
    },

    getBalanceInputsForUser(userId: string, accountId?: string) {
      return database.select({
        account: accounts,
        ...buildLedgerTotalColumns(),
      }).from(accounts)
        .leftJoin(transactions, and(
          eq(transactions.accountId, accounts.id),
          eq(transactions.userId, accounts.userId),
          eq(transactions.status, "POSTED"),
        ))
        .where(accountId ? and(eq(accounts.userId, userId), eq(accounts.id, accountId)) : eq(accounts.userId, userId))
        .groupBy(accounts.id)
        .orderBy(desc(accounts.updatedAt));
    },
  };
}
