import { describe, expect, it } from "vitest";
import { buildPromotionStartedIntent, evaluatePromotionExpiry } from "@know-finanzas/notifications";

describe("evaluatePromotionExpiry", () => {
  it.each([7, 3, 1])("fires PROMOTION_ENDING at the %i-day threshold", (days) => {
    const now = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const intents = evaluatePromotionExpiry({ grant: { id: "grant-1", endsAt }, now });

    expect(intents).toEqual([expect.objectContaining({ type: "PROMOTION_ENDING", category: "ACCOUNT", dedupKey: `PROMOTION_ENDING:grant-1:${days}` })]);
  });

  it("does not fire between thresholds", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    expect(evaluatePromotionExpiry({ grant: { id: "grant-1", endsAt }, now })).toEqual([]);
  });

  it("fires PROMOTION_EXPIRED once endsAt has passed", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    const endsAt = new Date("2026-01-01T00:00:00Z");
    const intents = evaluatePromotionExpiry({ grant: { id: "grant-1", endsAt }, now });

    expect(intents).toEqual([expect.objectContaining({ type: "PROMOTION_EXPIRED", category: "ACCOUNT", dedupKey: "PROMOTION_EXPIRED:grant-1" })]);
  });

  it("fires PROMOTION_EXPIRED exactly at endsAt (daysRemaining === 0)", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const intents = evaluatePromotionExpiry({ grant: { id: "grant-1", endsAt: now }, now });

    expect(intents).toEqual([expect.objectContaining({ type: "PROMOTION_EXPIRED" })]);
  });

  it("uses a distinct dedupKey per grant and per threshold, never colliding across grants", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const grantA = evaluatePromotionExpiry({ grant: { id: "grant-a", endsAt }, now });
    const grantB = evaluatePromotionExpiry({ grant: { id: "grant-b", endsAt }, now });

    expect(grantA[0].dedupKey).not.toBe(grantB[0].dedupKey);
  });
});

describe("buildPromotionStartedIntent", () => {
  it("builds a PROMOTION_STARTED intent with a stable, per-grant dedupKey", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const endsAt = new Date("2026-01-31T00:00:00Z");
    const intent = buildPromotionStartedIntent({ grant: { id: "grant-1", endsAt }, now });

    expect(intent).toMatchObject({ type: "PROMOTION_STARTED", category: "ACCOUNT", dedupKey: "PROMOTION_STARTED:grant-1" });
  });
});
