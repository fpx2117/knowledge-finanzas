import { describe, expect, it } from "vitest";
import { createProductAccessGate } from "../../apps/web/src/lib/billing/product-access-gate";
import { createAccountService } from "../../apps/web/src/features/accounts/services/account-service";
import { createDebtService } from "../../apps/web/src/features/debts/services/debt-service";
import { createBudgetService } from "../../apps/web/src/features/budgets/services/budget-service";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createBudgetQueries } from "../../packages/db/src/queries";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { createUserRepository } from "../../packages/db/src/repositories/users";
import { accounts, categories, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const trialUser = "00000000-0000-0000-0000-000000000001";
const expiredUser = "00000000-0000-0000-0000-000000000002";
const accountId = "10000000-0000-0000-0000-000000000001";
const categoryId = "20000000-0000-0000-0000-000000000001";

async function seedUsers() {
  const database = getTestDatabase().db;
  const now = new Date("2026-06-15T00:00:00Z");
  await database.insert(users).values([
    { id: trialUser, name: "Trial User", email: "trial@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: now, trialEndsAt: new Date("2026-06-29T00:00:00Z") },
    { id: expiredUser, name: "Expired User", email: "expired@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: new Date("2026-05-01T00:00:00Z"), trialEndsAt: new Date("2026-05-15T00:00:00Z") },
  ]);
  await database.insert(accounts).values({ id: accountId, userId: expiredUser, name: "Expired user account", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" });
}

function buildGate() {
  const database = getTestDatabase().db;
  return createProductAccessGate({
    users: createUserRepository(database),
    subscriptions: createBillingSubscriptionRepository(database),
    promotions: createPromotionRepository(database),
    graceDays: 0,
    now: () => new Date("2026-06-15T00:00:00Z"),
  });
}

describe("ProductAccessGate wired into write services (real repositories)", () => {
  it("blocks account creation for a user whose trial has expired and has no subscription", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const gate = buildGate();
    const service = createAccountService({ accounts: createAccountRepository(database), gate });

    await expect(service.createAccount(expiredUser, { name: "New account", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" }))
      .rejects.toMatchObject({ code: "PRODUCT_ACCESS_READ_ONLY" });
  });

  it("allows account creation for a user with an active trial", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const gate = buildGate();
    const service = createAccountService({ accounts: createAccountRepository(database), gate });

    await expect(service.createAccount(trialUser, { name: "New account", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" }))
      .resolves.toMatchObject({ userId: trialUser, name: "New account" });
  });

  it("blocks debt creation for an EXPIRED_READ_ONLY user", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const gate = buildGate();
    const service = createDebtService(database, gate);

    await expect(service.createDebt(expiredUser, {
      name: "Loan", type: "OTHER", currencyCode: "ARS", originalAmount: "100", startDate: "2026-01-01", interestType: "NO_INTEREST",
      installments: [{ installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" }],
    })).rejects.toMatchObject({ code: "PRODUCT_ACCESS_READ_ONLY" });
  });

  it("blocks budget creation for an EXPIRED_READ_ONLY user but allows it during trial", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    await database.insert(categories).values({ id: categoryId, userId: trialUser, name: "Food", type: "EXPENSE" });
    const gate = buildGate();
    const service = createBudgetService({
      budgets: createBudgetRepository(database),
      categories: createCategoryRepository(database),
      budgetQueries: createBudgetQueries(database),
      gate,
    });

    await expect(service.createBudget({ id: expiredUser, timezone: "UTC" }, { categoryId, currencyCode: "ARS", limitAmount: "100" }))
      .rejects.toMatchObject({ code: "PRODUCT_ACCESS_READ_ONLY" });

    await expect(service.createBudget({ id: trialUser, timezone: "UTC" }, { categoryId, currencyCode: "ARS", limitAmount: "100" }))
      .resolves.toMatchObject({ userId: trialUser, categoryId });
  });

  it("allows account creation for an otherwise-expired user with an active promotional grant", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    await createPromotionRepository(database).createManualGrant({
      userId: expiredUser,
      source: "ADMIN_OVERRIDE",
      startsAt: new Date("2026-06-01T00:00:00Z"),
      endsAt: new Date("2026-07-01T00:00:00Z"),
      aiCreditsPerPeriod: 0,
      whatsappMessagesPerPeriod: 0,
      periods: [],
    });
    const gate = buildGate();
    const service = createAccountService({ accounts: createAccountRepository(database), gate });

    await expect(service.createAccount(expiredUser, { name: "Promotional access account", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01" }))
      .resolves.toMatchObject({ userId: expiredUser, name: "Promotional access account" });
  });
});
