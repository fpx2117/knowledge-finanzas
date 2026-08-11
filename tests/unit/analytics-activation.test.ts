import { describe, expect, it } from "vitest";
import { evaluateActivationV1 } from "@know-finanzas/analytics";

const signupAt = new Date("2026-06-01T00:00:00Z");

function withinWindow(hours: number) {
  return new Date(signupAt.getTime() + hours * 60 * 60 * 1000);
}

describe("evaluateActivationV1", () => {
  it("is activated once all four conditions are met within the 7-day window", () => {
    const result = evaluateActivationV1({
      accountCount: 1,
      transactionCount: 5,
      dashboardViewed: true,
      cashflowViewed: true,
      signupAt,
      now: withinWindow(48),
    });
    expect(result).toBe(true);
  });

  it("is not activated with fewer than 5 transactions", () => {
    const result = evaluateActivationV1({ accountCount: 1, transactionCount: 4, dashboardViewed: true, cashflowViewed: true, signupAt, now: withinWindow(48) });
    expect(result).toBe(false);
  });

  it("is not activated with zero accounts", () => {
    const result = evaluateActivationV1({ accountCount: 0, transactionCount: 10, dashboardViewed: true, cashflowViewed: true, signupAt, now: withinWindow(48) });
    expect(result).toBe(false);
  });

  it("is not activated without a dashboard view", () => {
    const result = evaluateActivationV1({ accountCount: 1, transactionCount: 5, dashboardViewed: false, cashflowViewed: true, signupAt, now: withinWindow(48) });
    expect(result).toBe(false);
  });

  it("is not activated without a cashflow view", () => {
    const result = evaluateActivationV1({ accountCount: 1, transactionCount: 5, dashboardViewed: true, cashflowViewed: false, signupAt, now: withinWindow(48) });
    expect(result).toBe(false);
  });

  it("is not activated once the 7-day window has passed, even if all other conditions are met", () => {
    const result = evaluateActivationV1({ accountCount: 1, transactionCount: 5, dashboardViewed: true, cashflowViewed: true, signupAt, now: withinWindow(7 * 24 + 1) });
    expect(result).toBe(false);
  });

  it("is activated exactly at the 7-day boundary", () => {
    const result = evaluateActivationV1({ accountCount: 1, transactionCount: 5, dashboardViewed: true, cashflowViewed: true, signupAt, now: withinWindow(7 * 24) });
    expect(result).toBe(true);
  });
});
