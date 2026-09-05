import { describe, expect, it } from "vitest";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createAccountService } from "../../apps/web/src/features/accounts/services/account-service";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-ACCOUNTS-SPEC (OQ-007): archiving a non-zero-balance account is allowed (it doesn't destroy
// or move money — the balance just stops counting toward active totals). This proves the server
// side of that invariant; the warning shown before confirming lives in account-actions.tsx.

const userId = "00000000-0000-0000-0000-0000000010a1";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "archive@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const repo = createAccountRepository(database);
  const service = createAccountService({ accounts: repo });
  const account = await repo.create({ userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "500", openingDate: "2026-01-01" });
  return { service, accountId: account.id };
}

describe("account archiving (OQ-007)", () => {
  it("archives a non-zero-balance account without error — it is not blocked", async () => {
    const { service, accountId } = await seed();
    const archived = await service.archiveAccount(userId, accountId);
    expect(archived.status).toBe("ARCHIVED");
  });

  it("excludes the archived account's balance from the active-accounts total afterward", async () => {
    const { service, accountId } = await seed();

    const beforeArchive = await service.listAccounts(userId);
    expect(beforeArchive.find((a) => a.id === accountId)?.balance).toBe("500.00");

    await service.archiveAccount(userId, accountId);

    const activeOnly = await service.listAccounts(userId);
    expect(activeOnly.find((a) => a.id === accountId)).toBeUndefined();

    const includingArchived = await service.listAccounts(userId, { includeArchived: true });
    const archivedRow = includingArchived.find((a) => a.id === accountId);
    expect(archivedRow?.status).toBe("ARCHIVED");
    expect(archivedRow?.balance).toBe("500.00"); // history is preserved, not zeroed or hidden on request
  });

  it("archiving twice is a no-op, not an error", async () => {
    const { service, accountId } = await seed();
    await service.archiveAccount(userId, accountId);
    const second = await service.archiveAccount(userId, accountId);
    expect(second.status).toBe("ARCHIVED");
  });
});
