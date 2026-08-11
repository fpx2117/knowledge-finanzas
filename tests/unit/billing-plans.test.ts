import { describe, expect, it } from "vitest";
import {
  assertNoConflictingSubscription,
  assertPlanActive,
  BillingError,
  buildProMonthlyPlanSeed,
  isBillingError,
  PRO_MONTHLY_PLAN_CODE,
} from "@know-finanzas/billing";

describe("PRO_MONTHLY plan catalog", () => {
  it("builds a stable plan seed from configured price and currency", () => {
    const seed = buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD", providerPlanId: "mp-plan-123" });
    expect(seed).toMatchObject({ code: PRO_MONTHLY_PLAN_CODE, price: "7.99", currencyCode: "USD", provider: "MERCADO_PAGO", providerPlanId: "mp-plan-123", active: true });
  });

  it("defaults providerPlanId to null when not configured", () => {
    const seed = buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" });
    expect(seed.providerPlanId).toBeNull();
  });
});

describe("billing guards", () => {
  it("rejects a missing plan", () => {
    expect(() => assertPlanActive(undefined)).toThrow("BILLING_PLAN_NOT_FOUND");
  });

  it("rejects an inactive plan", () => {
    expect(() => assertPlanActive({ active: false })).toThrow("BILLING_PLAN_INACTIVE");
  });

  it("accepts an active plan without throwing", () => {
    expect(() => assertPlanActive({ active: true })).not.toThrow();
  });

  it("rejects starting a subscription when one is already effective", () => {
    expect(() => assertNoConflictingSubscription({ id: "existing" })).toThrow("BILLING_SUBSCRIPTION_ALREADY_ACTIVE");
  });

  it("allows starting a subscription when none is effective", () => {
    expect(() => assertNoConflictingSubscription(undefined)).not.toThrow();
  });
});

describe("BillingError", () => {
  it("identifies billing errors via the type guard", () => {
    const error = new BillingError("BILLING_PLAN_NOT_FOUND", { field: "planCode" });
    expect(isBillingError(error)).toBe(true);
    expect(isBillingError(new Error("plain"))).toBe(false);
    expect(error.code).toBe("BILLING_PLAN_NOT_FOUND");
    expect(error.field).toBe("planCode");
  });
});
