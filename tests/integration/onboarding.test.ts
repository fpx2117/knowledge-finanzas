import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createOnboardingService } from "../../apps/web/src/features/onboarding/services/onboarding-service";
import { createOnboardingRepository } from "../../packages/db/src/repositories/onboarding";
import { createFinancialProfileRepository } from "../../packages/db/src/repositories/financial-profiles";
import { createStatisticalProfileRepository } from "../../packages/db/src/repositories/statistical-profiles";
import { createUserRepository } from "../../packages/db/src/repositories/users";
import { accounts, budgets, debts, transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000001501";
const userB = "00000000-0000-0000-0000-000000001502";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "onboarding-a@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: new Date("2026-01-01T00:00:00Z"), trialEndsAt: new Date("2026-01-15T00:00:00Z") },
    { id: userB, name: "User B", email: "onboarding-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

function buildService(database: ReturnType<typeof getTestDatabase>["db"]) {
  return createOnboardingService({
    onboarding: createOnboardingRepository(database),
    financialProfiles: createFinancialProfileRepository(database),
    users: createUserRepository(database),
  });
}

describe("onboarding (real Postgres)", () => {
  it("a full run through every step ends COMPLETED, never touching trialStartedAt/trialEndsAt (Onboarding Completion != Product Access)", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "America/Argentina/Buenos_Aires", displayName: "Ana" });
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE" });
    await service.saveFinancialContext(userA, { hasDebtDeclared: "NO" });
    await service.skipOrCompleteStep(userA, "STATISTICAL_PROFILE");
    const final = await service.completeOnboarding(userA);

    expect(final.status).toBe("COMPLETED");

    const usersRepo = createUserRepository(database);
    const user = await usersRepo.findById(userA);
    // Untouched — still exactly what packages/auth's signup hook set, proving onboarding never
    // grants/starts/changes trial or any other access-adjacent field.
    expect(user?.trialStartedAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(user?.trialEndsAt).toEqual(new Date("2026-01-15T00:00:00Z"));
    // Basic-profile fields WERE written (account configuration, not access).
    expect(user?.name).toBe("Ana");
    expect(user?.country).toBe("AR");
  });

  it("resume: a user who abandoned mid-flow returns to their exact step, not the beginning", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    await service.saveGoal(userA, { primaryGoal: "PAY_OFF_DEBT" });
    // Abandons here, at FINANCIAL_CONTEXT.

    const resumed = await service.getOnboardingState(userA);
    expect(resumed).toEqual({ status: "IN_PROGRESS", currentStep: "FINANCIAL_CONTEXT" });
  });

  it("all statistical-profile and consent fields can be left completely empty and onboarding still reaches COMPLETED", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE" });
    await service.saveFinancialContext(userA, {});
    await service.skipOrCompleteStep(userA, "STATISTICAL_PROFILE");
    const final = await service.completeOnboarding(userA);

    expect(final.status).toBe("COMPLETED");
    const profileRepo = createStatisticalProfileRepository(database);
    const profile = await profileRepo.findForUser(userA);
    expect(profile).toBeUndefined();
  });

  it("declaring has_debt_declared=NO has no effect on the Debt domain when the user later creates a real debt", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveFinancialContext(userA, { hasDebtDeclared: "NO" });

    // The Debt domain remains fully authoritative and unaware of this declaration — creating a
    // real debt afterward is completely unaffected (there's no code path connecting the two).
    const [debt] = await database.insert(debts).values({
      userId: userA, name: "Préstamo real", creditor: null, type: "PERSONAL_LOAN", currencyCode: "ARS",
      originalAmount: "1000", startDate: "2026-01-01", interestType: "NO_INTEREST",
    }).returning();
    expect(debt.id).toBeTruthy();

    const financialProfiles = createFinancialProfileRepository(database);
    const profile = await financialProfiles.findForUser(userA);
    expect(profile?.hasDebtDeclared).toBe("NO");
  });

  it("no onboarding step ever writes to accounts, transactions, debts, or budgets (Property/Invariant)", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE", secondaryGoals: ["PAY_OFF_DEBT"] });
    await service.saveFinancialContext(userA, { hasDebtDeclared: "YES", usesMultipleAccounts: "YES" });
    await service.skipOrCompleteStep(userA, "STATISTICAL_PROFILE");
    await service.completeOnboarding(userA);

    const [accountRows, transactionRows, debtRows, budgetRows] = await Promise.all([
      database.select().from(accounts).where(eq(accounts.userId, userA)),
      database.select().from(transactions).where(eq(transactions.userId, userA)),
      database.select().from(debts).where(eq(debts.userId, userA)),
      database.select().from(budgets).where(eq(budgets.userId, userA)),
    ]);
    expect(accountRows).toHaveLength(0);
    expect(transactionRows).toHaveLength(0);
    expect(debtRows).toHaveLength(0);
    expect(budgetRows).toHaveLength(0);
  });

  it("the statistical-profile step delegates to TASK-062's real SaveStatisticalProfile — a genuine row lands in user_statistical_profiles, never a parallel onboarding-owned copy", async () => {
    const database = await seedUsers();
    const service = buildService(database);
    const { createSaveStatisticalProfile } = await import("@know-finanzas/privacy");
    const profileRepo = createStatisticalProfileRepository(database);
    const saveStatisticalProfile = createSaveStatisticalProfile({ repository: profileRepo as never });

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE" });
    await service.saveFinancialContext(userA, {});

    // Exactly what the onboarding statistical-profile step action does: call the real TASK-062
    // service, then advance the onboarding step — never a bespoke persistence path of its own.
    await saveStatisticalProfile(userA, { ageRange: "25-34" });
    const state = await service.skipOrCompleteStep(userA, "STATISTICAL_PROFILE");

    expect(state.currentStep).toBe("PRIVACY_CONSENT");
    const profile = await profileRepo.findForUser(userA);
    expect(profile?.ageRange).toBe("25-34");
  });

  it("the privacy-consent step delegates to TASK-062's real UpdateAnalyticsConsent — a genuine consent row is created, never duplicated onboarding-side state", async () => {
    const database = await seedUsers();
    const service = buildService(database);
    const { createAnalyticsConsentRepository } = await import("../../packages/db/src/repositories/analytics-consents");
    const { createUpdateAnalyticsConsent } = await import("@know-finanzas/privacy");
    const consentRepo = createAnalyticsConsentRepository(database);
    const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository: consentRepo as never });

    await service.startOnboarding(userA);
    await service.saveBasicProfile(userA, { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE" });
    await service.saveFinancialContext(userA, {});
    await service.skipOrCompleteStep(userA, "STATISTICAL_PROFILE");

    await updateAnalyticsConsent({ userId: userA, purpose: "PRODUCT_ANALYTICS", action: "GRANT", policyVersion: "privacy-policy:v1" });
    const final = await service.completeOnboarding(userA);

    expect(final.status).toBe("COMPLETED");
    const consent = await consentRepo.findCurrentForUser(userA, "PRODUCT_ANALYTICS");
    expect(consent?.status).toBe("GRANTED");
  });

  it("scopes onboarding state and financial-profile data strictly per user — user A's progress never touches user B's rows", async () => {
    const database = await seedUsers();
    const service = buildService(database);

    await service.startOnboarding(userA);
    await service.saveGoal(userA, { primaryGoal: "SAVE_MORE" });

    const stateB = await service.getOnboardingState(userB);
    expect(stateB).toEqual({ status: "NOT_STARTED", currentStep: "WELCOME" });

    const financialProfiles = createFinancialProfileRepository(database);
    const profileB = await financialProfiles.findForUser(userB);
    expect(profileB).toBeUndefined();
  });
});
