import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { transactions as transactionsTable, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-LEDGER-IDEMP (spec 14 §38 / Foundation §14): a create command carrying an idempotency key
// is applied at most once, even under a concurrent retry, against the real Postgres partial
// unique index `transactions_user_command_unique`.

const userId = "00000000-0000-0000-0000-0000000004a1";
const commandId = "aaaaaaaa-0000-0000-0000-0000000004a1";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "idemp@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01",
  });
  return { database, accountId: account.id };
}

function newExpense(accountId: string, overrides: Record<string, unknown> = {}) {
  return {
    userId, accountId, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
    type: "EXPENSE" as const, amount: "100", currencyCode: "ARS", description: "Gasto", merchant: null,
    occurredAt: new Date("2026-01-02T00:00:00Z"), postedAt: new Date("2026-01-02T00:00:00Z"), source: "MANUAL" as const, notes: null,
    ...overrides,
  };
}

async function countRows(database: Awaited<ReturnType<typeof seed>>["database"]) {
  const rows = await database.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));
  return rows.length;
}

describe("transaction create idempotency (§38)", () => {
  it("a sequential retry with the same command key returns the original row and writes nothing new", async () => {
    const { database, accountId } = await seed();
    const repo = createTransactionRepository(database);

    const first = await repo.create(newExpense(accountId, { commandId }));
    const retry = await repo.create(newExpense(accountId, { commandId, amount: "999", description: "otro" }));

    expect(retry?.id).toBe(first?.id);
    expect(retry?.amount).toBe(first?.amount);
    expect(await countRows(database)).toBe(1);
  });

  it("two concurrent creates with the same command key resolve to one row", async () => {
    const { database, accountId } = await seed();
    const repo = createTransactionRepository(database);

    const [a, b] = await Promise.all([
      repo.create(newExpense(accountId, { commandId })),
      repo.create(newExpense(accountId, { commandId })),
    ]);

    expect(a?.id).toBe(b?.id);
    expect(await countRows(database)).toBe(1);
  });

  it("different command keys create distinct rows", async () => {
    const { database, accountId } = await seed();
    const repo = createTransactionRepository(database);

    await repo.create(newExpense(accountId, { commandId }));
    await repo.create(newExpense(accountId, { commandId: "aaaaaaaa-0000-0000-0000-0000000004a2" }));

    expect(await countRows(database)).toBe(2);
  });

  it("a null command key is never deduplicated", async () => {
    const { database, accountId } = await seed();
    const repo = createTransactionRepository(database);

    await repo.create(newExpense(accountId, { commandId: null }));
    await repo.create(newExpense(accountId, { commandId: null }));

    expect(await countRows(database)).toBe(2);
  });

  it("findByCommandId is user-scoped", async () => {
    const { database, accountId } = await seed();
    const repo = createTransactionRepository(database);
    await repo.create(newExpense(accountId, { commandId }));

    await expect(repo.findByCommandId("00000000-0000-0000-0000-0000000004ff", commandId)).resolves.toBeUndefined();
    await expect(repo.findByCommandId(userId, commandId)).resolves.toMatchObject({ commandId });
  });
});
