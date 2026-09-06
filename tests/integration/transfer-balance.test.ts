import { describe, expect, it } from "vitest";

import { createAccountBalanceQueries } from "../../packages/db/src/queries";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createAccountService } from "../../apps/web/src/features/accounts/services/account-service";
import { users } from "../../packages/db/src/schema";
import { createTransferService } from "../../apps/web/src/features/transfers/services/transfer-service";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-LEDGER-EXHAUSTIVE (spec 14 §4.5/§5.1): a transfer between the user's own accounts must move
// the balance shown on both accounts. Three hand-written SQL balance queries independently forgot
// `TRANSFER_IN`/`TRANSFER_OUT` before this test existed (finding L-3 in
// `docs/implementation/02-financial-domain-audit.md`) — a transfer silently left both accounts'
// displayed balances unchanged. Exercised here through the real `createAccountService`, the same
// path `/accounts` and `/accounts/:id` use in production.

const userId = "00000000-0000-0000-0000-0000000008a1";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "transfer-balance@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const repo = createAccountRepository(database);
  const from = await repo.create({ userId, name: "Origen", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
  const to = await repo.create({ userId, name: "Destino", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
  const accountService = createAccountService({ accounts: repo });
  const transferService = createTransferService(database);
  return { fromAccountId: from.id, toAccountId: to.id, accountService, transferService };
}

describe("transfer moves the displayed account balance (§4.5 / L-3)", () => {
  it("after a $100 transfer, the source account balance drops and the destination rises", async () => {
    const { fromAccountId, toAccountId, accountService, transferService } = await seed();

    await transferService.createTransfer({ id: userId, timezone: "UTC" }, { fromAccountId, toAccountId, amount: "100", occurredAt: "2026-01-15T12:00:00Z" });

    const accounts = await accountService.listAccounts(userId);
    const from = accounts.find((a) => a.id === fromAccountId)!;
    const to = accounts.find((a) => a.id === toAccountId)!;

    expect(from.balance).toBe("900.00");
    expect(to.balance).toBe("100.00");
  });

  it("getAccountOverview (the account detail page's data source) agrees", async () => {
    const { fromAccountId, toAccountId, accountService, transferService } = await seed();

    await transferService.createTransfer({ id: userId, timezone: "UTC" }, { fromAccountId, toAccountId, amount: "250", occurredAt: "2026-01-15T12:00:00Z" });

    const from = await accountService.getAccountOverview(userId, fromAccountId);
    const to = await accountService.getAccountOverview(userId, toAccountId);

    expect(from.balance).toBe("750.00");
    expect(to.balance).toBe("250.00");
  });

  // `getLiquidTotalsForUser` sums the per-type ledger columns inside a subquery, then references
  // them by name — which throws "raw SQL field … doesn't have an alias declared" unless the
  // columns are aliased. It was the only consumer, is not covered by any other test, and silently
  // rendered an error page on `/obligations/upcoming` (its one caller) for weeks.
  it("getLiquidTotalsForUser returns the currency total including transfers, without a subquery-alias error", async () => {
    const { fromAccountId, toAccountId, transferService } = await seed();
    const database = getTestDatabase().db;

    await transferService.createTransfer({ id: userId, timezone: "UTC" }, { fromAccountId, toAccountId, amount: "300", occurredAt: "2026-01-15T12:00:00Z" });

    const totals = await createAccountBalanceQueries(database).getLiquidTotalsForUser(userId);

    // Opening 1000 + 0, moved 300 between them — the ARS total is unchanged at 1000.
    expect(totals).toEqual([{ currencyCode: "ARS", total: "1000.000000" }]);
  });
});
