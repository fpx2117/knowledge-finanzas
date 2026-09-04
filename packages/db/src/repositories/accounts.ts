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
      currencyCode: string;
      openingBalance: string;
      openingDate: string;
    }) {
      return database.insert(accounts).values({
        ...input,
        status: "ACTIVE",
        archivedAt: null,
      }).returning().then(([account]) => account);
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
