import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { transfers as transfersTable, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-LEDGER-IDEMP inc. 2 (spec 14 §38): a transfer create command carrying an idempotency key
// moves the money at most once, even under a concurrent retry, against the real
// `transfers_user_command_unique` partial unique index.

const userId = "00000000-0000-0000-0000-0000000005a1";
const commandId = "bbbbbbbb-0000-0000-0000-0000000005a1";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "transfer-idemp@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const accounts = createAccountRepository(database);
  const from = await accounts.create({ userId, name: "Origen", type: "BANK", currencyCode: "ARS", openingBalance: "10000", openingDate: "2026-01-01" });
  const to = await accounts.create({ userId, name: "Destino", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  return { database, fromAccountId: from.id, toAccountId: to.id };
}

async function countRows(database: Awaited<ReturnType<typeof seed>>["database"]) {
  const rows = await database.select().from(transfersTable).where(eq(transfersTable.userId, userId));
  return rows.length;
}

describe("transfer create idempotency (§38)", () => {
  it("a sequential retry with the same command key returns the original transfer and moves no money twice", async () => {
    const { database, fromAccountId, toAccountId } = await seed();
    const service = createTransferService(database);
    const input = { fromAccountId, toAccountId, amount: "100", occurredAt: "2026-01-15T12:00:00Z", commandId };

    const first = await service.createTransfer({ id: userId, timezone: "UTC" }, input);
    const retry = await service.createTransfer({ id: userId, timezone: "UTC" }, input);

    expect(retry.transfer.id).toBe(first.transfer.id);
    expect(await countRows(database)).toBe(1);
  });

  it("two concurrent creates with the same command key resolve to one transfer", async () => {
    const { database, fromAccountId, toAccountId } = await seed();
    const service = createTransferService(database);
    const input = { fromAccountId, toAccountId, amount: "100", occurredAt: "2026-01-15T12:00:00Z", commandId };

    const [a, b] = await Promise.all([
      service.createTransfer({ id: userId, timezone: "UTC" }, input),
      service.createTransfer({ id: userId, timezone: "UTC" }, input),
    ]);

    expect(a.transfer.id).toBe(b.transfer.id);
    expect(await countRows(database)).toBe(1);
  });

  it("different command keys create distinct transfers", async () => {
    const { database, fromAccountId, toAccountId } = await seed();
    const service = createTransferService(database);

    await service.createTransfer({ id: userId, timezone: "UTC" }, { fromAccountId, toAccountId, amount: "100", occurredAt: "2026-01-15T12:00:00Z", commandId });
    await service.createTransfer({ id: userId, timezone: "UTC" }, { fromAccountId, toAccountId, amount: "50", occurredAt: "2026-01-16T12:00:00Z", commandId: "bbbbbbbb-0000-0000-0000-0000000005a2" });

    expect(await countRows(database)).toBe(2);
  });

  it("omitting the command key never deduplicates", async () => {
    const { database, fromAccountId, toAccountId } = await seed();
    const service = createTransferService(database);
    const input = { fromAccountId, toAccountId, amount: "100", occurredAt: "2026-01-15T12:00:00Z" };

    await service.createTransfer({ id: userId, timezone: "UTC" }, input);
    await service.createTransfer({ id: userId, timezone: "UTC" }, input);

    expect(await countRows(database)).toBe(2);
  });
});
