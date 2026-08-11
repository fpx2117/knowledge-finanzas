import { describe, expect, it } from "vitest";
import { createProductAccessGate } from "../../apps/web/src/lib/billing/product-access-gate";

function fakeUsers(trialEndsAt: Date | null) {
  return { findAccessInputById: async () => ({ trialEndsAt }) };
}

function fakeSubscriptions(subscription: { status: "PENDING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED" | "EXPIRED"; currentPeriodEnd: Date | null } | null) {
  return { findEffectiveForUser: async () => subscription ?? undefined };
}

function fakePromotions(grant: { endsAt: Date } | null) {
  return { findActiveGrantForUser: async () => grant ?? undefined };
}

describe("ProductAccessGate", () => {
  it("resolves TRIAL for a user with an active trial and no subscription", async () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const gate = createProductAccessGate({ users: fakeUsers(new Date("2026-06-10T00:00:00Z")), subscriptions: fakeSubscriptions(null), graceDays: 0, now: () => now });

    await expect(gate.getAccessState("user-1")).resolves.toBe("TRIAL");
    await expect(gate.assertCanWrite("user-1")).resolves.toBeUndefined();
  });

  it("resolves PRO for a user with an ACTIVE subscription", async () => {
    const gate = createProductAccessGate({ users: fakeUsers(null), subscriptions: fakeSubscriptions({ status: "ACTIVE", currentPeriodEnd: new Date("2026-07-01T00:00:00Z") }), graceDays: 0 });

    await expect(gate.getAccessState("user-1")).resolves.toBe("PRO");
    await expect(gate.assertCanWrite("user-1")).resolves.toBeUndefined();
  });

  it("blocks writes with PRODUCT_ACCESS_READ_ONLY once trial and subscription are both ineffective", async () => {
    const now = new Date("2026-06-20T00:00:00Z");
    const gate = createProductAccessGate({ users: fakeUsers(new Date("2026-06-01T00:00:00Z")), subscriptions: fakeSubscriptions(null), graceDays: 0, now: () => now });

    await expect(gate.getAccessState("user-1")).resolves.toBe("EXPIRED_READ_ONLY");
    await expect(gate.assertCanWrite("user-1")).rejects.toMatchObject({ code: "PRODUCT_ACCESS_READ_ONLY" });
  });

  it("treats a missing user access row the same as no active trial", async () => {
    const gate = createProductAccessGate({ users: { findAccessInputById: async () => undefined }, subscriptions: fakeSubscriptions(null), graceDays: 0 });

    await expect(gate.assertCanWrite("unknown-user")).rejects.toMatchObject({ code: "PRODUCT_ACCESS_READ_ONLY" });
  });

  it("honors the configured grace period for PAST_DUE subscriptions", async () => {
    const now = new Date("2026-06-05T00:00:00Z");
    const currentPeriodEnd = new Date("2026-06-01T00:00:00Z");
    const withinGrace = createProductAccessGate({ users: fakeUsers(null), subscriptions: fakeSubscriptions({ status: "PAST_DUE", currentPeriodEnd }), graceDays: 7, now: () => now });
    const outsideGrace = createProductAccessGate({ users: fakeUsers(null), subscriptions: fakeSubscriptions({ status: "PAST_DUE", currentPeriodEnd }), graceDays: 1, now: () => now });

    await expect(withinGrace.getAccessState("user-1")).resolves.toBe("PRO");
    await expect(outsideGrace.getAccessState("user-1")).resolves.toBe("EXPIRED_READ_ONLY");
  });

  it("resolves PRO and allows writes for a user with an active promotional grant and no subscription", async () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const gate = createProductAccessGate({ users: fakeUsers(null), subscriptions: fakeSubscriptions(null), promotions: fakePromotions({ endsAt: new Date("2026-07-01T00:00:00Z") }), graceDays: 0, now: () => now });

    await expect(gate.getAccessState("user-1")).resolves.toBe("PRO");
    await expect(gate.assertCanWrite("user-1")).resolves.toBeUndefined();
  });

  it("treats an omitted promotions dependency the same as no active promotion", async () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const gate = createProductAccessGate({ users: fakeUsers(null), subscriptions: fakeSubscriptions(null), graceDays: 0, now: () => now });

    await expect(gate.getAccessState("user-1")).resolves.toBe("EXPIRED_READ_ONLY");
  });
});
