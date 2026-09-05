import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-TRANSACTIONS-EDIT (spec 14 CM-02, bounded scope): description/merchant/category/notes only,
// against the real repository and a real Postgres ownership boundary.

const ownerId = "00000000-0000-0000-0000-0000000009a1";
const otherUserId = "00000000-0000-0000-0000-0000000009a2";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: ownerId, name: "Owner", email: "edit-owner@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: otherUserId, name: "Other", email: "edit-other@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  const accounts = createAccountRepository(database);
  const categories = createCategoryRepository(database);
  const account = await accounts.create({ userId: ownerId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const groceries = await categories.create({ userId: ownerId, name: "Supermercado", type: "EXPENSE", parentId: null });
  const transport = await categories.create({ userId: ownerId, name: "Transporte", type: "EXPENSE", parentId: null });
  const transactions = createTransactionRepository(database);
  const service = createTransactionService({
    accounts,
    categories,
    transactions,
  });
  const created = await transactions.create({
    userId: ownerId, accountId: account.id, categoryId: groceries.id, originalTransactionId: null, relatedTransactionId: null, reason: null,
    type: "EXPENSE", amount: "500", currencyCode: "ARS", description: "Compra original", merchant: "Coto",
    occurredAt: new Date("2026-01-05T00:00:00Z"), postedAt: new Date("2026-01-05T00:00:00Z"), source: "MANUAL", notes: null,
  });
  return { service, transactionId: created!.id, groceriesId: groceries.id, transportId: transport.id, transactionsRepo: transactions };
}

describe("transaction edit (CM-02, bounded scope)", () => {
  it("updates description/merchant/category/notes and marks the category user-explicit", async () => {
    const { service, transactionId, transportId, transactionsRepo } = await seed();

    await service.editTransaction(ownerId, transactionId, {
      description: "Compra corregida",
      merchant: "Carrefour",
      categoryId: transportId,
      notes: "corregido a mano",
    });

    const row = await transactionsRepo.findByIdForUser(transactionId, ownerId);
    expect(row).toMatchObject({
      description: "Compra corregida",
      merchant: "Carrefour",
      categoryId: transportId,
      notes: "corregido a mano",
      amount: "500.000000", // untouched — amount is not editable
    });
    expect(row?.classification).toMatchObject({ method: "user_explicit", reviewedByUser: true, categoryConfidence: 1 });
  });

  it("never lets one user edit another user's transaction (IDOR)", async () => {
    const { service, transactionId, transactionsRepo } = await seed();

    await expect(service.editTransaction(otherUserId, transactionId, { description: "hijack" })).rejects.toMatchObject({ code: "TRANSACTION_NOT_FOUND" });

    const row = await transactionsRepo.findByIdForUser(transactionId, ownerId);
    expect(row?.description).toBe("Compra original");
  });

  it("rejects editing after the transaction is voided", async () => {
    const { service, transactionId, transactionsRepo } = await seed();
    await transactionsRepo.voidForUser(transactionId, ownerId, new Date());

    await expect(service.editTransaction(ownerId, transactionId, { description: "x" })).rejects.toMatchObject({ code: "TRANSACTION_ALREADY_VOIDED" });
  });

  it("does not touch amount, account, date, or type", async () => {
    const { service, transactionId, transactionsRepo, groceriesId } = await seed();
    const before = await transactionsRepo.findByIdForUser(transactionId, ownerId);

    await service.editTransaction(ownerId, transactionId, { description: "sólo texto", categoryId: groceriesId });

    const after = await transactionsRepo.findByIdForUser(transactionId, ownerId);
    expect(after?.amount).toBe(before?.amount);
    expect(after?.accountId).toBe(before?.accountId);
    expect(after?.occurredAt).toEqual(before?.occurredAt);
    expect(after?.type).toBe(before?.type);
  });
});
