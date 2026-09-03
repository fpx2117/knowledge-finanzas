import { describe, expect, it } from "vitest";
import { basicProfileSchema, financialContextSchema, goalSchema, nextOnboardingStep, ONBOARDING_STEPS } from "../../apps/web/src/features/onboarding/schemas/onboarding-schemas";

describe("basicProfileSchema", () => {
  it("accepts the minimum mandatory fields (country/currency/timezone), no displayName/language", () => {
    const result = basicProfileSchema.safeParse({ country: "AR", currencyCode: "ARS", timezone: "America/Argentina/Buenos_Aires" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed country code", () => {
    const result = basicProfileSchema.safeParse({ country: "Argentina", currencyCode: "ARS", timezone: "UTC" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing currency", () => {
    const result = basicProfileSchema.safeParse({ country: "AR", timezone: "UTC" });
    expect(result.success).toBe(false);
  });
});

describe("goalSchema", () => {
  it("accepts a primary goal alone, with no secondary goals", () => {
    const result = goalSchema.safeParse({ primaryGoal: "SAVE_MORE" });
    expect(result.success).toBe(true);
  });

  it("accepts up to 2 secondary goals distinct from the primary", () => {
    const result = goalSchema.safeParse({ primaryGoal: "SAVE_MORE", secondaryGoals: ["PAY_OFF_DEBT", "PLAN_EXPENSES"] });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 secondary goals", () => {
    const result = goalSchema.safeParse({ primaryGoal: "SAVE_MORE", secondaryGoals: ["PAY_OFF_DEBT", "PLAN_EXPENSES", "OTHER"] });
    expect(result.success).toBe(false);
  });

  it("rejects a secondary goal that duplicates the primary goal", () => {
    const result = goalSchema.safeParse({ primaryGoal: "SAVE_MORE", secondaryGoals: ["SAVE_MORE"] });
    expect(result.success).toBe(false);
  });
});

describe("financialContextSchema", () => {
  it("accepts a completely empty submission (every question skipped)", () => {
    const result = financialContextSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts PREFER_NOT_TO_SAY for every question", () => {
    const result = financialContextSchema.safeParse({
      incomePattern: "PREFER_NOT_TO_SAY", usesCreditCards: "PREFER_NOT_TO_SAY", hasDebtDeclared: "PREFER_NOT_TO_SAY",
      hasRecurringExpensesDeclared: "PREFER_NOT_TO_SAY", usesMultipleAccounts: "PREFER_NOT_TO_SAY", managementStyle: "PREFER_NOT_TO_SAY",
    });
    expect(result.success).toBe(true);
  });

  it("never accepts a numeric amount for any field", () => {
    const result = financialContextSchema.safeParse({ hasDebtDeclared: "5000" as never });
    expect(result.success).toBe(false);
  });
});

describe("nextOnboardingStep", () => {
  it("walks the steps in order", () => {
    expect(nextOnboardingStep("WELCOME")).toBe("BASIC_PROFILE");
    expect(nextOnboardingStep("GOAL")).toBe("FINANCIAL_CONTEXT");
  });

  it("returns null past the last step", () => {
    expect(nextOnboardingStep(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1])).toBeNull();
  });
});
