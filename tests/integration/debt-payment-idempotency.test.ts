import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createDebtPaymentService } from "../../apps/web/src/features/debts/services/debt-payment-service";
import { debtPayments, debts, debtInstallments, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-LEDGER-IDEMP inc. 3 (spec 14 §38 / §14.1): a debt-payment record command carrying an
// idempotency key is applied at most once, even under a concurrent retry, against the real
// `debt_payments_user_command_unique` partial unique index — the anti-double-count invariant
// depends on this never writing the same payment twice.

const userId = "00000000-0000-0000-0000-0000000006a1";
const debtId = "40000000-0000-0000-0000-0000000006a1";
const commandId = "cccccccc-0000-0000-0000-0000000006a1";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "debt-idemp@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "10000", openingDate: "2026-01-01",
  });
  await database.insert(debts).values({ id: debtId, userId, name: "Deuda", type: "OTHER", currencyCode: "ARS", originalAmount: "1000", startDate: "2026-01-01", interestType: "NO_INTEREST" });
  await database.insert(debtInstallments).values({ debtId, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "1000", interestAmount: "0", feeAmount: "0", totalAmount: "1000" });
  return { database, accountId: account.id };
}

async function countPayments(database: Awaited<ReturnType<typeof seed>>["database"]) {
  const rows = await database.select().from(debtPayments).where(eq(debtPayments.userId, userId));
  return rows.length;
}

describe("debt payment idempotency (§38 / §14.1)", () => {
  it("a sequential retry with the same command key returns the same result and records one payment", async () => {
    const { database, accountId } = await seed();
    const service = createDebtPaymentService(database);
    const input = { debtId, accountId, amount: "300", commandId };

    const first = await service.recordDebtPayment({ id: userId, timezone: "UTC" }, input);
    const retry = await service.recordDebtPayment({ id: userId, timezone: "UTC" }, input);

    expect(retry).toEqual(first);
    expect(first.debtRemaining).toBe("700.00");
    expect(await countPayments(database)).toBe(1);
  });

  it("two concurrent payments with the same command key apply the money once — no double-count (§14.1)", async () => {
    const { database, accountId } = await seed();
    const service = createDebtPaymentService(database);
    const input = { debtId, accountId, amount: "300", commandId };

    const [a, b] = await Promise.all([
      service.recordDebtPayment({ id: userId, timezone: "UTC" }, input),
      service.recordDebtPayment({ id: userId, timezone: "UTC" }, input),
    ]);

    expect(a.debtRemaining).toBe("700.00");
    expect(b.debtRemaining).toBe("700.00");
    expect(await countPayments(database)).toBe(1);
  });

  it("different command keys record distinct payments", async () => {
    const { database, accountId } = await seed();
    const service = createDebtPaymentService(database);

    await service.recordDebtPayment({ id: userId, timezone: "UTC" }, { debtId, accountId, amount: "300", commandId });
    await service.recordDebtPayment({ id: userId, timezone: "UTC" }, { debtId, accountId, amount: "200", commandId: "cccccccc-0000-0000-0000-0000000006a2" });

    expect(await countPayments(database)).toBe(2);
  });

  it("omitting the command key never deduplicates", async () => {
    const { database, accountId } = await seed();
    const service = createDebtPaymentService(database);
    const input = { debtId, accountId, amount: "100" };

    await service.recordDebtPayment({ id: userId, timezone: "UTC" }, input);
    await service.recordDebtPayment({ id: userId, timezone: "UTC" }, input);

    expect(await countPayments(database)).toBe(2);
  });
});
