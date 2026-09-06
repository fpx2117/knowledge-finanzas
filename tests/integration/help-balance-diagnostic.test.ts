import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createHelpService } from "../../apps/web/src/features/help/services/help-service";
import { transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-HELP-MODULE (spec 12 §11): the balance diagnostic detects common causes of a mismatched
// balance and is strictly read-only (§11.4 — never corrects or deletes).

const userId = "00000000-0000-0000-0000-00000000d001";
const timezone = "UTC";
const now = () => new Date("2026-09-20T12:00:00Z");

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "help-diagnostic@example.test", timezone, baseCurrency: "ARS" });
  const accountsRepo = createAccountRepository(database);
  const ars = await accountsRepo.create({ userId, name: "Pesos", type: "BANK", currencyCode: "ARS", openingBalance: "100000", openingDate: "2026-01-01" });
  await accountsRepo.create({ userId, name: "Dólares", type: "SAVINGS", currencyCode: "USD", openingBalance: "500", openingDate: "2026-01-01" });

  const row = (over: Partial<typeof transactions.$inferInsert>) => ({
    userId, accountId: ars.id, currencyCode: "ARS", description: "x", type: "EXPENSE" as const,
    status: "POSTED" as const, occurredAt: new Date("2026-09-10T12:00:00Z"), amount: "1000", ...over,
  });

  await database.insert(transactions).values([
    row({ categoryId: null, description: "sin cat 1" }),
    row({ categoryId: null, description: "sin cat 2" }),
    row({ type: "ADJUSTMENT_OUT", amount: "25000", description: "Ajuste de saldo", categoryId: null }),
    row({ description: "Compra futura", occurredAt: new Date("2026-09-25T12:00:00Z") }),
  ]);

  return { database, service: createHelpService(database, now) };
}

describe("help balance diagnostic (spec 12 §11)", () => {
  it("detects uncategorised movements, a balance adjustment, future-dated rows and multi-currency", async () => {
    const { service } = await seed();
    const findings = await service.diagnoseBalance({ id: userId, timezone });
    const keys = findings.map((f) => f.key.split("-")[0]).sort();

    expect(keys).toContain("uncategorized");
    expect(keys).toContain("adjustment");
    expect(keys).toContain("future");
    expect(keys).toContain("multi");
    expect(findings.find((f) => f.key === "uncategorized")!.title).toContain("3");
  });

  it("never mutates any transaction", async () => {
    const { database, service } = await seed();
    const before = await database.select().from(transactions).where(eq(transactions.userId, userId));
    await service.diagnoseBalance({ id: userId, timezone });
    const after = await database.select().from(transactions).where(eq(transactions.userId, userId));
    expect(after.map((r) => ({ id: r.id, cat: r.categoryId, status: r.status, updatedAt: r.updatedAt.getTime() }))).toEqual(
      before.map((r) => ({ id: r.id, cat: r.categoryId, status: r.status, updatedAt: r.updatedAt.getTime() })),
    );
  });
});
