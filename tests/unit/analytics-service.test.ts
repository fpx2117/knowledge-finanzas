import { describe, expect, it } from "vitest";
import { createAnalyticsService, type AnalyticsProvider } from "@know-finanzas/analytics";

function fakeProvider(overrides: Partial<AnalyticsProvider> = {}): AnalyticsProvider {
  return {
    record: async () => ({ created: true }),
    ...overrides,
  };
}

describe("AnalyticsService.track", () => {
  it("records a valid critical event with a supplied event_id", async () => {
    const track = createAnalyticsService({ provider: fakeProvider(), environment: "test" });
    const result = await track("user_signed_up", {}, { eventId: "user_signed_up:user-1", userId: "user-1" });
    expect(result).toEqual({ recorded: true, deduplicated: false });
  });

  it("refuses a critical event with no event_id, without throwing", async () => {
    const track = createAnalyticsService({ provider: fakeProvider(), environment: "test" });
    const result = await track("user_signed_up", {}, { userId: "user-1" });
    expect(result).toEqual({ recorded: false, deduplicated: false, reason: "EVENT_ID_REQUIRED" });
  });

  it("records a non-critical event with no event_id", async () => {
    const track = createAnalyticsService({ provider: fakeProvider(), environment: "test" });
    const result = await track("dashboard_viewed", {}, { userId: "user-1" });
    expect(result).toEqual({ recorded: true, deduplicated: false });
  });

  it("rejects a schema-invalid payload without throwing", async () => {
    const track = createAnalyticsService({ provider: fakeProvider(), environment: "test" });
    const result = await track("transaction_created", { type: "EXPENSE", currencyCode: "ARS", amount: "100" }, { eventId: "t:1", userId: "user-1" });
    expect(result).toEqual({ recorded: false, deduplicated: false, reason: "SCHEMA_INVALID" });
  });

  it("reports deduplication when the provider signals created:false (e.g. a unique-constraint absorb)", async () => {
    const track = createAnalyticsService({ provider: fakeProvider({ record: async () => ({ created: false }) }), environment: "test" });
    const result = await track("user_signed_up", {}, { eventId: "user_signed_up:user-1", userId: "user-1" });
    expect(result).toEqual({ recorded: false, deduplicated: true });
  });

  it("never throws when the provider itself throws (simulated outage) — Financial Invariant", async () => {
    const track = createAnalyticsService({ provider: fakeProvider({ record: async () => { throw new Error("provider is down"); } }), environment: "test" });
    const result = await track("transaction_created", { type: "EXPENSE", currencyCode: "ARS", amountBucket: "LOW" }, { eventId: "t:1", userId: "user-1" });
    expect(result).toEqual({ recorded: false, deduplicated: false, reason: "PROVIDER_ERROR" });
  });

  it("uses the no-op provider by default when none is supplied", async () => {
    const track = createAnalyticsService({ environment: "test" });
    const result = await track("dashboard_viewed", {}, {});
    expect(result).toEqual({ recorded: true, deduplicated: false });
  });

  it("passes environment/internal/userId through to the provider", async () => {
    let captured: unknown;
    const track = createAnalyticsService({
      provider: fakeProvider({ record: async (event) => { captured = event; return { created: true }; } }),
      environment: "production",
    });
    await track("dashboard_viewed", {}, { userId: "user-1", internal: true });
    expect(captured).toMatchObject({ environment: "production", internal: true, userId: "user-1", eventName: "dashboard_viewed" });
  });
});
