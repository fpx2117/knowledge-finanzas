import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createCalendarService } from "../../apps/web/src/features/calendar/services/calendar-service";
import { debts, debtInstallments, scheduledTransactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-CALENDAR-LAYERS (spec 06 §0.1/§5): every event carries an unambiguous temporal-
// financial layer, currencies stay separate (§10), and DST doesn't move an event to the
// wrong month.

const userId = "00000000-0000-0000-0000-0000000ca1e0";
const debtId = "40000000-0000-0000-0000-0000000ca1e0";
const timezone = "America/New_York";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "calendar-layers@example.test", timezone, baseCurrency: "USD" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "USD", openingBalance: "1000", openingDate: "2026-01-01",
  });
  const transactions = createTransactionRepository(database);

  // CONFIRMED — posted movement.
  await transactions.create({
    userId, accountId: account.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
    type: "EXPENSE", amount: "40", currencyCode: "USD", description: "Compra", merchant: null,
    occurredAt: new Date("2026-03-10T15:00:00Z"), postedAt: new Date("2026-03-10T15:00:00Z"), source: "MANUAL", notes: null,
  });
  // Month-boundary near a DST shift: NY 00:30 EST Mar 1 is in March; NY 23:30 EST Feb 28 is not.
  await transactions.create({
    userId, accountId: account.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
    type: "EXPENSE", amount: "1", currencyCode: "USD", description: "Justo despues de medianoche", merchant: null,
    occurredAt: new Date("2026-03-01T05:30:00Z"), postedAt: new Date("2026-03-01T05:30:00Z"), source: "MANUAL", notes: null,
  });
  await transactions.create({
    userId, accountId: account.id, categoryId: null, originalTransactionId: null, relatedTransactionId: null, reason: null,
    type: "EXPENSE", amount: "2", currencyCode: "USD", description: "Justo antes de medianoche", merchant: null,
    occurredAt: new Date("2026-03-01T04:30:00Z"), postedAt: new Date("2026-03-01T04:30:00Z"), source: "MANUAL", notes: null,
  });

  // COMMITTED (future) + OVERDUE (past, same displayed month).
  await database.insert(debts).values({ id: debtId, userId, name: "Préstamo", type: "PERSONAL_LOAN", currencyCode: "USD", originalAmount: "200", startDate: "2026-01-01", interestType: "NO_INTEREST" });
  await database.insert(debtInstallments).values([
    { debtId, installmentNumber: 1, dueDate: "2026-03-05", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" },
    { debtId, installmentNumber: 2, dueDate: "2026-03-25", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" },
  ]);

  // SCHEDULED — one in base currency, one in another currency (must not be summed).
  await database.insert(scheduledTransactions).values([
    { userId, accountId: account.id, type: "EXPENSE", expectedAmount: "30", currencyCode: "USD", description: "Servicio", scheduledDate: "2026-03-20", status: "SCHEDULED" },
    { userId, accountId: account.id, type: "EXPENSE", expectedAmount: "5000", currencyCode: "ARS", description: "Cargo ARS", scheduledDate: "2026-03-22", status: "SCHEDULED" },
  ]);

  return createCalendarService(database);
}

describe("calendar layers (integration)", () => {
  it("classifies every event by its temporal-financial layer", async () => {
    const month = await (await seed()).getMonth({
      userId, timezone, baseCurrency: "USD", period: "2026-03", now: new Date("2026-03-15T16:00:00Z"),
    });

    const layerByTitle = new Map(month.events.map((e) => [e.title, e.layer]));
    expect(layerByTitle.get("Compra")).toBe("CONFIRMED");
    expect(layerByTitle.get("Préstamo · cuota 2")).toBe("COMMITTED");
    expect(layerByTitle.get("Préstamo · cuota 1")).toBe("OVERDUE");
    expect(layerByTitle.get("Servicio")).toBe("SCHEDULED");
  });

  it("keeps currencies separate in the month summary", async () => {
    const month = await (await seed()).getMonth({
      userId, timezone, baseCurrency: "USD", period: "2026-03", now: new Date("2026-03-15T16:00:00Z"),
    });
    expect(month.excludedCurrencies).toEqual(["ARS"]);
    expect(month.events.some((e) => e.title === "Cargo ARS")).toBe(true); // visible in the grid
    expect(Number(month.summary.layers.committed)).toBe(100);
    expect(Number(month.summary.layers.overdue)).toBe(100);
  });

  it("buckets events by the user's timezone across the month boundary near DST", async () => {
    const month = await (await seed()).getMonth({
      userId, timezone, baseCurrency: "USD", period: "2026-03", now: new Date("2026-04-10T16:00:00Z"),
    });
    const titles = month.events.map((e) => e.title);
    expect(titles).toContain("Justo despues de medianoche"); // NY Mar 1 00:30
    expect(titles).not.toContain("Justo antes de medianoche"); // NY Feb 28 23:30
  });
});
