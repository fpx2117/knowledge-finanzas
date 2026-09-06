import { describe, expect, it } from "vitest";
import {
  assessMateriality,
  insightPriorityScore,
  reconcileInsights,
  sortByPriority,
  type InsightCandidate,
} from "@know-finanzas/finance";

const candidate = (over: Partial<InsightCandidate> & Pick<InsightCandidate, "family" | "dedupeKey">): InsightCandidate => ({
  sufficiency: "SUFFICIENT",
  confidence: "MEDIUM",
  title: "T",
  body: "B",
  impactAmount: null,
  impactCurrency: null,
  cta: null,
  evidence: {
    sourceTypes: ["transaction"],
    sourceIds: [],
    period: { from: "2026-09-01", to: "2026-10-01" },
    currency: "ARS",
    metrics: {},
    calculationVersion: "insights-1",
    dataQualityFlags: [],
    generatedAt: "2026-09-15T00:00:00Z",
  },
  ...over,
});

describe("insight materiality (§23)", () => {
  it("filters a big % on a tiny amount and a tiny % on a big amount", () => {
    expect(assessMateriality({ family: "INS-SPEND-DELTA", amount: "800", relativeChange: 0.9, monthlyScale: "500000" }).material).toBe(false);
    expect(assessMateriality({ family: "INS-SPEND-DELTA", amount: "60000", relativeChange: 0.04, monthlyScale: "500000" }).material).toBe(false);
    expect(assessMateriality({ family: "INS-SPEND-DELTA", amount: "60000", relativeChange: 0.2, monthlyScale: "500000" }).material).toBe(true);
  });

  it("cash risk has no relative gate — any real shortfall is material", () => {
    expect(assessMateriality({ family: "INS-CASH-RISK", amount: "5", relativeChange: null, monthlyScale: null }).material).toBe(true);
  });
});

describe("insight reconciliation (§8/§17/§18)", () => {
  const now = "2026-09-15T00:00:00Z";

  it("inserts a new candidate, skips an unchanged one, resolves a vanished one", () => {
    const actions = reconcileInsights(
      [candidate({ family: "INS-BUDGET-LIMIT", dedupeKey: "a", body: "same" }), candidate({ family: "INS-CASH-RISK", dedupeKey: "b" })],
      [
        { id: "1", family: "INS-BUDGET-LIMIT", dedupeKey: "a", status: "ACTIVE", body: "same", dismissedAt: null },
        { id: "2", family: "INS-GOAL-PACE", dedupeKey: "gone", status: "ACTIVE", body: "x", dismissedAt: null },
      ],
      now,
    );
    expect(actions).toContainEqual({ kind: "skip", dedupeKey: "a", reason: "unchanged" });
    expect(actions).toContainEqual(expect.objectContaining({ kind: "insert" }));
    expect(actions).toContainEqual({ kind: "resolve", id: "2" });
  });

  it("updates copy in place when the body changed (supersede, never duplicate)", () => {
    const actions = reconcileInsights(
      [candidate({ family: "INS-BUDGET-LIMIT", dedupeKey: "a", body: "new copy" })],
      [{ id: "1", family: "INS-BUDGET-LIMIT", dedupeKey: "a", status: "SEEN", body: "old copy", dismissedAt: null }],
      now,
    );
    expect(actions).toContainEqual(expect.objectContaining({ kind: "update", id: "1", reactivate: false }));
  });

  it("respects the dismiss cooldown, then reactivates once it's over", () => {
    const withinCooldown = reconcileInsights(
      [candidate({ family: "INS-BUDGET-LIMIT", dedupeKey: "a" })],
      [{ id: "1", family: "INS-BUDGET-LIMIT", dedupeKey: "a", status: "DISMISSED", body: "x", dismissedAt: "2026-09-10T00:00:00Z" }],
      now,
    );
    expect(withinCooldown[0]).toEqual({ kind: "skip", dedupeKey: "a", reason: "within dismiss cooldown" });

    const pastCooldown = reconcileInsights(
      [candidate({ family: "INS-BUDGET-LIMIT", dedupeKey: "a" })],
      [{ id: "1", family: "INS-BUDGET-LIMIT", dedupeKey: "a", status: "DISMISSED", body: "x", dismissedAt: "2026-08-01T00:00:00Z" }],
      now,
    );
    expect(pastCooldown[0]).toEqual(expect.objectContaining({ kind: "update", reactivate: true }));
  });

  it("never emits an INSUFFICIENT candidate", () => {
    const actions = reconcileInsights([candidate({ family: "INS-SPEND-DELTA", dedupeKey: "a", sufficiency: "INSUFFICIENT" })], [], now);
    expect(actions).toEqual([{ kind: "skip", dedupeKey: "a", reason: "insufficient evidence" }]);
  });
});

describe("insight priority (§8 — auditable factors, not one opaque score)", () => {
  it("ranks cash risk above data quality regardless of impact", () => {
    expect(
      insightPriorityScore({ family: "INS-CASH-RISK", confidence: "MEDIUM", impactAmount: null, monthlyScale: null }),
    ).toBeGreaterThan(insightPriorityScore({ family: "INS-DATA-QUALITY", confidence: "HIGH", impactAmount: null, monthlyScale: null }));
  });

  it("sortByPriority puts the most urgent first", () => {
    const sorted = sortByPriority([
      candidate({ family: "INS-DATA-QUALITY", dedupeKey: "d" }),
      candidate({ family: "INS-CASH-RISK", dedupeKey: "c" }),
      candidate({ family: "INS-GOAL-PACE", dedupeKey: "g" }),
    ]);
    expect(sorted.map((s) => s.family)).toEqual(["INS-CASH-RISK", "INS-GOAL-PACE", "INS-DATA-QUALITY"]);
  });
});
