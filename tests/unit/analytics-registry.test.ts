import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENT_NAMES, EVENT_REGISTRY, getEventDefinition } from "@know-finanzas/analytics";

describe("analytics event registry", () => {
  it("has a definition for every declared AnalyticsEventName", () => {
    for (const name of ANALYTICS_EVENT_NAMES) {
      expect(getEventDefinition(name)).toBeDefined();
    }
    expect(EVENT_REGISTRY.size).toBe(ANALYTICS_EVENT_NAMES.length);
  });

  it("rejects a transaction_created payload carrying a raw amount instead of a bucket (strict schema, no free-text financial fields)", () => {
    const definition = getEventDefinition("transaction_created")!;
    const result = definition.schema.safeParse({ type: "EXPENSE", currencyCode: "ARS", amount: "1234.56" });
    expect(result.success).toBe(false);
  });

  it("rejects a transaction_created payload carrying a merchant field", () => {
    const definition = getEventDefinition("transaction_created")!;
    const result = definition.schema.safeParse({ type: "EXPENSE", currencyCode: "ARS", amountBucket: "LOW", merchant: "Some Store" });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed transaction_created payload (bucketed amount only)", () => {
    const definition = getEventDefinition("transaction_created")!;
    const result = definition.schema.safeParse({ type: "EXPENSE", currencyCode: "ARS", amountBucket: "LOW" });
    expect(result.success).toBe(true);
  });

  it("rejects a promotion_redeemed payload carrying a raw promotion code string instead of the id", () => {
    const definition = getEventDefinition("promotion_redeemed")!;
    const result = definition.schema.safeParse({ code: "WELCOME30" });
    expect(result.success).toBe(false);
  });

  it("marks the server-authoritative funnel/KPI events as critical (event_id required)", () => {
    for (const name of ["user_signed_up", "trial_started", "account_created", "transaction_created", "user_activated", "subscription_activated", "promotion_redeemed", "referral_attributed", "referral_converted", "ai_capability_executed", "ai_credits_exhausted"] as const) {
      expect(getEventDefinition(name)!.critical).toBe(true);
    }
  });

  it("marks client-ish view/interaction signals as non-critical", () => {
    for (const name of ["dashboard_viewed", "cashflow_viewed", "checkout_started", "notification_action_clicked", "product_access_changed"] as const) {
      expect(getEventDefinition(name)!.critical).toBe(false);
    }
  });
});
