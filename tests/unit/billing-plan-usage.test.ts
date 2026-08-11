import { describe, expect, it } from "vitest";
import { buildProductAccessSummary, type LimitConfig } from "@know-finanzas/billing";

const limitConfig: LimitConfig = {
  trialAiCreditsTotal: 50,
  trialWhatsAppTotal: 3,
  proAiCreditsPerPeriod: 300,
  proWhatsAppPerPeriod: 20,
};

describe("product access summary (Plan & Usage read model)", () => {
  it("reports trial days remaining and configured allowances without fabricating usage", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const trialEndsAt = new Date("2026-06-09T00:00:00Z");
    const summary = buildProductAccessSummary({ now, state: "TRIAL", trialEndsAt, currentPeriodEnd: null, limitConfig });

    expect(summary).toMatchObject({ state: "TRIAL", trial: { daysRemaining: 8 } });
    if (summary.state === "TRIAL") {
      expect(summary.ai).toBeNull();
      expect(summary.whatsapp).toBeNull();
    }
  });

  it("reports trial usage when injected", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const trialEndsAt = new Date("2026-06-09T00:00:00Z");
    const summary = buildProductAccessSummary({ now, state: "TRIAL", trialEndsAt, currentPeriodEnd: null, limitConfig, aiUsed: 19, whatsAppUsed: 1 });

    if (summary.state !== "TRIAL") throw new Error("expected TRIAL");
    expect(summary.ai).toEqual({ used: 19, limit: 50, remaining: 31 });
    expect(summary.whatsapp).toEqual({ used: 1, limit: 3, remaining: 2 });
  });

  it("reports the pro renewal date and per-period allowance", () => {
    const now = new Date("2026-06-15T00:00:00Z");
    const currentPeriodEnd = new Date("2026-07-01T00:00:00Z");
    const summary = buildProductAccessSummary({ now, state: "PRO", trialEndsAt: null, currentPeriodEnd, limitConfig, aiUsed: 184, whatsAppUsed: 8 });

    expect(summary).toMatchObject({ state: "PRO", billing: { renewsAt: currentPeriodEnd } });
    if (summary.state !== "PRO") throw new Error("expected PRO");
    expect(summary.ai).toEqual({ used: 184, limit: 300, remaining: 116 });
    expect(summary.whatsapp).toEqual({ used: 8, limit: 20, remaining: 12 });
  });

  it("reports EXPIRED_READ_ONLY as reactivatable with historical data accessible, not as 0/300 usage exhaustion", () => {
    const summary = buildProductAccessSummary({ now: new Date(), state: "EXPIRED_READ_ONLY", trialEndsAt: null, currentPeriodEnd: null, limitConfig });
    expect(summary).toEqual({ state: "EXPIRED_READ_ONLY", canReactivate: true, historicalDataAccessible: true });
  });

  it("never reports negative days remaining once the trial end has passed", () => {
    const now = new Date("2026-06-20T00:00:00Z");
    const trialEndsAt = new Date("2026-06-01T00:00:00Z");
    const summary = buildProductAccessSummary({ now, state: "TRIAL", trialEndsAt, currentPeriodEnd: null, limitConfig });
    expect(summary).toMatchObject({ trial: { daysRemaining: 0 } });
  });
});
