import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-SHELL-PALETTE (spec 13 §15.3 / §22): the palette's entity search is read-only and
// ownership-scoped at source.

const userA = "00000000-0000-0000-0000-0000000c9001";
const userB = "00000000-0000-0000-0000-0000000c9002";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "A", email: "cp-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "B", email: "cp-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  const accountsRepo = createAccountRepository(database);
  const accA = await accountsRepo.create({ userId: userA, name: "A", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const accB = await accountsRepo.create({ userId: userB, name: "B", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const txns = createTransactionRepository(database);

  const row = (userId: string, accountId: string, over: Partial<typeof transactions.$inferInsert>) => ({
    userId, accountId, currencyCode: "ARS", type: "EXPENSE" as const, status: "POSTED" as const,
    occurredAt: new Date("2026-09-10T12:00:00Z"), amount: "1000", description: "x", ...over,
  });
  await database.insert(transactions).values([
    row(userA, accA.id, { description: "Compra en Carrefour Market", merchant: "Carrefour" }),
    row(userA, accA.id, { description: "Nafta", merchant: "YPF Carrefour Norte" }),
    row(userA, accA.id, { description: "Kiosco", merchant: "Maxi", status: "VOIDED" }),
    row(userB, accB.id, { description: "Carrefour de B", merchant: "Carrefour" }),
  ]);

  return { txns };
}

describe("command palette entity search", () => {
  it("matches the user's own POSTED movements by description or merchant", async () => {
    const { txns } = await seed();
    const results = await txns.searchForUser(userA, "carrefour");
    expect(results.map((r) => r.description).sort()).toEqual(["Compra en Carrefour Market", "Nafta"].sort());
  });

  it("never returns another user's movements", async () => {
    const { txns } = await seed();
    const results = await txns.searchForUser(userA, "carrefour");
    expect(results.some((r) => r.description === "Carrefour de B")).toBe(false);
  });

  it("ignores queries shorter than 2 characters", async () => {
    const { txns } = await seed();
    expect(await txns.searchForUser(userA, "c")).toEqual([]);
  });
});
