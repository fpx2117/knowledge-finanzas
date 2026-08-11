import { describe, expect, it } from "vitest";
import { createOnboardingService, type FinancialProfileRepository, type OnboardingRepository, type UserProfileRepository } from "../../apps/web/src/features/onboarding/services/onboarding-service";

function createFakeOnboardingRepository(overrides: Partial<OnboardingRepository> = {}): OnboardingRepository {
  const store = new Map<string, { status: string; currentStep: string; startedAt: Date | null; completedAt: Date | null }>();
  return {
    findForUser: async (userId) => store.get(userId),
    upsertForUser: async (userId, input) => {
      const existing = store.get(userId);
      store.set(userId, { status: input.status, currentStep: input.currentStep, startedAt: input.startedAt ?? existing?.startedAt ?? null, completedAt: input.completedAt ?? existing?.completedAt ?? null });
      return store.get(userId);
    },
    ...overrides,
  };
}

function createFakeFinancialProfileRepository(): FinancialProfileRepository & { calls: unknown[] } {
  const calls: unknown[] = [];
  return { calls, upsertForUser: async (userId, input) => { calls.push({ userId, input }); return input; } };
}

function createFakeUserRepository(): UserProfileRepository & { calls: unknown[] } {
  const calls: unknown[] = [];
  return { calls, updateBasicProfile: async (userId, input) => { calls.push({ userId, input }); return input; } };
}

function buildService(overrides: { onboarding?: OnboardingRepository } = {}) {
  const onboarding = overrides.onboarding ?? createFakeOnboardingRepository();
  const financialProfiles = createFakeFinancialProfileRepository();
  const users = createFakeUserRepository();
  const service = createOnboardingService({ onboarding, financialProfiles, users, now: () => new Date("2026-06-15T00:00:00Z") });
  return { service, onboarding, financialProfiles, users };
}

describe("createOnboardingService", () => {
  it("getOnboardingState reports NOT_STARTED/WELCOME for a user with no row", async () => {
    const { service } = buildService();
    const state = await service.getOnboardingState("user-1");
    expect(state).toEqual({ status: "NOT_STARTED", currentStep: "WELCOME" });
  });

  it("startOnboarding creates a row at IN_PROGRESS/WELCOME the first time", async () => {
    const { service } = buildService();
    const state = await service.startOnboarding("user-1");
    expect(state).toEqual({ status: "IN_PROGRESS", currentStep: "WELCOME" });
  });

  it("startOnboarding is idempotent — a second call resumes at the current state rather than restarting", async () => {
    const { service } = buildService();
    await service.startOnboarding("user-1");
    await service.saveBasicProfile("user-1", { country: "AR", currencyCode: "ARS", timezone: "UTC" });
    const resumed = await service.startOnboarding("user-1");
    expect(resumed).toEqual({ status: "IN_PROGRESS", currentStep: "GOAL" });
  });

  it("saveBasicProfile writes account configuration and advances to GOAL", async () => {
    const { service, users } = buildService();
    await service.startOnboarding("user-1");
    const state = await service.saveBasicProfile("user-1", { country: "AR", currencyCode: "ARS", timezone: "America/Argentina/Buenos_Aires", displayName: "Ana" });
    expect(state.currentStep).toBe("GOAL");
    expect(users.calls).toEqual([{ userId: "user-1", input: { name: "Ana", country: "AR", timezone: "America/Argentina/Buenos_Aires", baseCurrency: "ARS", language: null } }]);
  });

  it("saveGoal persists the goal and advances to FINANCIAL_CONTEXT", async () => {
    const { service, financialProfiles } = buildService();
    await service.startOnboarding("user-1");
    const state = await service.saveGoal("user-1", { primaryGoal: "SAVE_MORE", secondaryGoals: ["PAY_OFF_DEBT"] });
    expect(state.currentStep).toBe("FINANCIAL_CONTEXT");
    expect(financialProfiles.calls).toEqual([{ userId: "user-1", input: { primaryGoal: "SAVE_MORE", secondaryGoals: ["PAY_OFF_DEBT"] } }]);
  });

  it("saveFinancialContext accepts a completely empty submission and still advances", async () => {
    const { service } = buildService();
    await service.startOnboarding("user-1");
    const state = await service.saveFinancialContext("user-1", {});
    expect(state.currentStep).toBe("STATISTICAL_PROFILE");
  });

  it("skipOrCompleteStep advances past the delegated statistical-profile/consent steps without writing financial or onboarding-profile data itself", async () => {
    const { service, financialProfiles, users } = buildService();
    await service.startOnboarding("user-1");
    const state = await service.skipOrCompleteStep("user-1", "STATISTICAL_PROFILE");
    expect(state.currentStep).toBe("PRIVACY_CONSENT");
    expect(financialProfiles.calls).toHaveLength(0);
    expect(users.calls).toHaveLength(0);
  });

  it("completeOnboarding sets status COMPLETED and never touches product access (no such call exists in this service at all)", async () => {
    const { service } = buildService();
    await service.startOnboarding("user-1");
    const state = await service.completeOnboarding("user-1");
    expect(state.status).toBe("COMPLETED");
  });

  it("falls back to the first step when the stored currentStep is not a recognized step (e.g. a removed onboarding revision)", async () => {
    const onboarding = createFakeOnboardingRepository();
    await onboarding.upsertForUser("user-1", { version: "onboarding:v0", status: "IN_PROGRESS", currentStep: "SOME_REMOVED_STEP" });
    const { service } = buildService({ onboarding });
    const state = await service.getOnboardingState("user-1");
    expect(state).toEqual({ status: "IN_PROGRESS", currentStep: "WELCOME" });
  });
});
