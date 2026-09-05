import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createObligationReadModel } from "../../apps/web/src/features/obligations/services/obligation-read-model";
import {
  debts,
  debtInstallments,
  merchants,
  scheduledTransactions,
  subscriptions,
  users,
} from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-OBLIGATION-READMODEL (spec 05 §6/§10): the unified read model must fold debt
// installments + scheduled expenses + detected subscriptions into one per-currency
// shape, keep confirmed/estimated apart (§10.3), and never merge currencies (§22).

const userId = "00000000-0000-0000-0000-00000000b101";
const debtId = "40000000-0000-0000-0000-00000000b101";
const merchantId = "50000000-0000-0000-0000-00000000b101";
const timezone = "UTC";
const now = new Date("2026-09-05T12:00:00Z");

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function seed() {
  const database = getTestDatabase().db;
  const today = "2026-09-05";
  await database.insert(users).values({ id: userId, name: "User", email: "obligation-read-model@example.test", timezone, baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000000", openingDate: "2026-01-01",
  });

  // Debt installment — FIXED / COMMITTED, partially paid handled elsewhere.
  await database.insert(debts).values({ id: debtId, userId, name: "Préstamo", type: "PERSONAL_LOAN", currencyCode: "ARS", originalAmount: "450000", startDate: "2026-01-01", interestType: "NO_INTEREST" });
  await database.insert(debtInstallments).values({ debtId, installmentNumber: 3, dueDate: addDays(today, 8), principalAmount: "450000", interestAmount: "0", feeAmount: "0", totalAmount: "450000" });

  // Scheduled expense — FIXED / EXPECTED. A scheduled INCOME must be ignored.
  await database.insert(scheduledTransactions).values([
    { userId, accountId: account.id, type: "EXPENSE", expectedAmount: "120000", currencyCode: "ARS", description: "Alquiler", scheduledDate: addDays(today, 10), status: "SCHEDULED" },
    { userId, accountId: account.id, type: "INCOME", expectedAmount: "800000", currencyCode: "ARS", description: "Sueldo", scheduledDate: addDays(today, 12), status: "SCHEDULED" },
  ]);

  // Detected subscription — ESTIMATED / EXPECTED, in a non-base currency.
  // merchants is a shared reference table, not truncated between tests.
  await database.insert(merchants).values({ id: merchantId, slug: "spotify-test", canonicalName: "Spotify" }).onConflictDoNothing();
  await database.insert(subscriptions).values({
    userId, merchantId, label: "Spotify", frequency: "MONTHLY", currencyCode: "USD", currentAmount: "12",
    firstChargedOn: "2026-01-04", lastChargedOn: "2026-08-04", nextExpectedOn: addDays(today, 4),
    chargeCount: 8, confidence: "0.9", status: "ACTIVE",
  });

  return createObligationReadModel(database);
}

describe("obligation read model (integration)", () => {
  it("unifies the three sources, keeps confirmed vs estimated and currencies apart", async () => {
    const model = await (await seed()).getObligations({ userId, timezone, baseCurrency: "ARS", horizonDays: 30, now });

    // Alquiler + cuota (ARS) + Spotify (USD) — the scheduled INCOME is excluded.
    expect(model.items.map((i) => i.title).sort()).toEqual(["Préstamo · cuota 3", "Alquiler", "Spotify"].sort());

    const ars = model.totals.find((t) => t.currencyCode === "ARS")!;
    expect(ars.confirmed).toBe("570000.00"); // 450000 + 120000, both FIXED
    expect(ars.estimated).toBe("0.00");

    const usd = model.totals.find((t) => t.currencyCode === "USD")!;
    expect(usd.confirmed).toBe("0.00");
    expect(usd.estimated).toBe("12.00"); // subscription is ESTIMATED

    expect(model.totals[0].currencyCode).toBe("ARS"); // base currency first
    expect(model.excludedCurrencies).toEqual(["USD"]);
    expect(model.estimatedCount).toBe(1);
  });

  it("honours the horizon window", async () => {
    const model = await (await seed()).getObligations({ userId, timezone, baseCurrency: "ARS", horizonDays: 7, now });
    // Only the subscription (due +4d) fits a 7-day horizon.
    expect(model.items.map((i) => i.title)).toEqual(["Spotify"]);
  });
});
