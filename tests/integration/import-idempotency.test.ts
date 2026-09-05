import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createImportBatchRepository } from "../../packages/db/src/repositories/import-batches";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";
import { createImportService } from "../../apps/web/src/features/imports/services/import-service";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-IMPORTS-CF05 / spec 14 §38: a retried commit of the same import batch (same commandId)
// must not re-import every row a second time, against the real `import_batches` partial unique
// index — not just the row-level fingerprint heuristic.

const userId = "00000000-0000-0000-0000-0000000011a1";
const commandId = "dddddddd-0000-0000-0000-0000000011a1";

const CSV = [
  "Fecha;Descripción;Débito;Crédito",
  "01/09/2026;COMPRA CARREFOUR;15400,00;",
  "02/09/2026;MERPAGO YPF;8500,00;",
].join("\n");

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "import-idemp@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const accountsRepo = createAccountRepository(database);
  const account = await accountsRepo.create({ userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const transactionsRepo = createTransactionRepository(database);
  const txnService = createTransactionService({ accounts: accountsRepo, categories: { findByIdForUser: async () => undefined }, transactions: transactionsRepo });
  const importBatches = createImportBatchRepository(database);
  const importService = createImportService({
    accounts: accountsRepo,
    transactions: transactionsRepo,
    importBatches,
    createTransaction: (uid, type, input, timezone) =>
      type === "INCOME" ? txnService.createIncomeTransaction(uid, input, timezone) : txnService.createExpenseTransaction(uid, input, timezone),
  });
  return { importService, transactionsRepo, accountId: account.id };
}

async function countTransactions(transactionsRepo: Awaited<ReturnType<typeof seed>>["transactionsRepo"], userId2: string) {
  const rows = await transactionsRepo.listForUser(userId2, { limit: 100 });
  return rows.length;
}

describe("import commit idempotency (§38)", () => {
  it("a sequential retry with the same command key returns the original result and imports nothing twice", async () => {
    const { importService, transactionsRepo, accountId } = await seed();
    const input = { accountId, text: CSV, timezone: "UTC", commandId };

    const first = await importService.commitImport(userId, input);
    const retry = await importService.commitImport(userId, input);

    expect(retry).toEqual(first);
    expect(first.imported).toBe(2);
    expect(await countTransactions(transactionsRepo, userId)).toBe(2);
  });

  it("two concurrent commits with the same command key import the batch's rows only once", async () => {
    const { importService, transactionsRepo, accountId } = await seed();
    const input = { accountId, text: CSV, timezone: "UTC", commandId };

    const [a, b] = await Promise.all([importService.commitImport(userId, input), importService.commitImport(userId, input)]);

    expect(a.batchId).toBe(b.batchId);
    expect(await countTransactions(transactionsRepo, userId)).toBe(2);
  });

  it("different command keys commit as independent batches", async () => {
    const { importService, transactionsRepo, accountId } = await seed();

    await importService.commitImport(userId, { accountId, text: CSV, timezone: "UTC", commandId });
    await importService.commitImport(userId, { accountId, text: CSV, timezone: "UTC", commandId: "dddddddd-0000-0000-0000-0000000011a2" });

    // The second commit's rows fingerprint-match the first's (same content) and get skipped as
    // duplicates rather than re-imported — proving the row-level guard still holds even when the
    // batch-level idempotency key differs.
    expect(await countTransactions(transactionsRepo, userId)).toBe(2);
  });
});
