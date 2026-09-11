import { describe, expect, it } from "vitest";
import {
  buildProactiveCandidates,
  selectProactive,
  DEFAULT_KAI_FREQUENCY_CAP,
  type KaiDeliveryState,
  type ProactiveInput,
} from "@know-finanzas/kai";

const base = (over: Partial<ProactiveInput> = {}): ProactiveInput => ({
  monthly: [{ currencyCode: "ARS", income: "1200000", expense: "850000", net: "350000" }],
  previousMonthly: [{ currencyCode: "ARS", income: "1200000", expense: "1000000", net: "200000" }],
  topCategories: [],
  budgets: [],
  upcoming: [],
  baseCurrency: "ARS",
  today: "2026-11-14",
  ...over,
});

const emptyState = (): KaiDeliveryState => ({
  resolvedDedupKeys: [],
  snoozed: [],
  mutedKinds: [],
  shownInWindow: 0,
  lastShownAt: null,
});

describe("buildProactiveCandidates", () => {
  it("returns [] when nothing is worth interrupting for", () => {
    expect(buildProactiveCandidates(base({ previousMonthly: base().monthly }))).toEqual([]);
  });

  it("budget-exceeded (P1) outranks month-review (P3)", () => {
    const c = buildProactiveCandidates(
      base({
        budgets: [{ name: "Comida", status: "EXCEEDED", usagePercent: 130, limit: "300000", spent: "390000", currencyCode: "ARS" }],
        topCategories: [
          { label: "Vivienda", amount: "420000", currencyCode: "ARS" },
          { label: "Alimentación", amount: "280000", currencyCode: "ARS" },
        ],
      }),
    );
    expect(c[0]).toMatchObject({ kind: "budget-exceeded", state: "ALERT", priority: 1 });
    expect(c.map((x) => x.kind)).toContain("month-review");
  });

  it("category-spike when a category grew >20% MoM", () => {
    const c = buildProactiveCandidates(
      base({
        topCategories: [{ label: "Transporte", amount: "150000", currencyCode: "ARS" }, { label: "Comida", amount: "90000", currencyCode: "ARS" }],
        previousTopCategories: [{ label: "Transporte", amount: "100000", currencyCode: "ARS" }, { label: "Comida", amount: "90000", currencyCode: "ARS" }],
      }),
    );
    const spike = c.find((x) => x.kind === "category-spike");
    expect(spike?.body).toContain("Transporte");
    expect(spike?.body).toContain("50%");
  });

  it("goal-milestone at 50%", () => {
    const c = buildProactiveCandidates(base({ goals: [{ name: "Viaje", actualProgressRatio: 0.52 }] }));
    expect(c.find((x) => x.kind === "goal-milestone")?.title).toContain("50%");
  });

  it("savings-up (P4) as a fallback", () => {
    const c = buildProactiveCandidates(base());
    expect(c[0]).toMatchObject({ kind: "savings-up", state: "POSITIVE", priority: 4 });
  });

  it("surfaces a detected insight (critical → P1)", () => {
    const c = buildProactiveCandidates(
      base({
        insights: [
          { id: "ins-1", family: "INS-CASH-RISK", title: "Riesgo de quedarte corto", body: "Proyectás negativo el 25.", severity: "critical", route: "/insights/ins-1" },
        ],
      }),
    );
    const ins = c.find((x) => x.id === "insight:ins-1");
    expect(ins).toMatchObject({ state: "ALERT", priority: 1 });
    expect(ins?.primary.route).toBe("/insights/ins-1");
  });

  it("subscription-due when a renewal is ≤7 days out", () => {
    const c = buildProactiveCandidates(
      base({ subscriptions: [{ label: "Netflix", currencyCode: "ARS", currentAmount: "5000", nextExpectedOn: "2026-11-18" }] }),
    );
    expect(c.find((x) => x.kind === "subscription-due")?.body).toContain("4 días");
  });

  it("subscription-price-change when the amount moved", () => {
    const c = buildProactiveCandidates(
      base({ subscriptions: [{ label: "Netflix", currencyCode: "ARS", currentAmount: "6500", previousAmount: "5000", nextExpectedOn: null }] }),
    );
    const p = c.find((x) => x.kind === "subscription-price-change");
    expect(p?.title).toContain("aumentó");
    expect(p?.body).toContain("30%");
  });

  it("large-transaction when one expense dwarfs the rest", () => {
    const small = Array.from({ length: 6 }, (_, i) => ({ description: `c${i}`, merchant: null, amount: "3000", currencyCode: "ARS" }));
    const c = buildProactiveCandidates(
      base({ recentExpenses: [...small, { description: "Notebook", merchant: "Mercado Libre", amount: "180000", currencyCode: "ARS" }] }),
    );
    const big = c.find((x) => x.kind === "large-transaction");
    expect(big?.body).toContain("Mercado Libre");
  });
});

describe("selectProactive (priority queue + frequency cap)", () => {
  const cand = buildProactiveCandidates(
    base({
      budgets: [{ name: "Comida", status: "EXCEEDED", usagePercent: 130, limit: "300000", spent: "390000", currencyCode: "ARS" }],
    }),
  );

  it("shows the top-priority eligible candidate", () => {
    const r = selectProactive(cand, emptyState(), new Date("2026-11-14T12:00:00Z"));
    expect(r).toMatchObject({ reason: "shown" });
    expect(r.message?.kind).toBe("budget-exceeded");
  });

  it("skips a dismissed dedupKey and falls to the next", () => {
    const r = selectProactive(
      cand,
      { ...emptyState(), resolvedDedupKeys: [cand[0].id] },
      new Date("2026-11-14T12:00:00Z"),
    );
    expect(r.message?.kind).toBe("savings-up");
  });

  it("respects the daily cap (max 3)", () => {
    const r = selectProactive(
      buildProactiveCandidates(base()),
      { ...emptyState(), shownInWindow: DEFAULT_KAI_FREQUENCY_CAP.maxPerWindow },
      new Date(),
    );
    expect(r).toEqual({ message: null, reason: "cap-reached" });
  });

  it("respects the min-gap cooldown", () => {
    const now = new Date("2026-11-14T12:00:00Z");
    const r = selectProactive(
      buildProactiveCandidates(base()),
      { ...emptyState(), lastShownAt: new Date(now.getTime() - 10 * 60_000).toISOString() },
      now,
    );
    expect(r).toEqual({ message: null, reason: "cooldown" });
  });

  it("hides a muted kind", () => {
    const r = selectProactive(
      buildProactiveCandidates(base()),
      { ...emptyState(), mutedKinds: ["savings-up"] },
      new Date(),
    );
    expect(r.message).toBeNull();
  });

  it("respects quiet hours (23–8) for a non-critical candidate", () => {
    const r = selectProactive(buildProactiveCandidates(base()), emptyState(), new Date(), undefined, 2);
    expect(r).toEqual({ message: null, reason: "quiet-hours" });
  });

  it("does not apply quiet hours outside the window", () => {
    const r = selectProactive(buildProactiveCandidates(base()), emptyState(), new Date(), undefined, 12);
    expect(r.reason).toBe("shown");
  });

  it("never suppresses a P0 candidate for quiet hours", () => {
    const p0: KaiProactiveMessage = { ...cand[0], priority: 0 };
    const r = selectProactive([p0], emptyState(), new Date("2026-11-14T12:00:00Z"), undefined, 3);
    expect(r).toMatchObject({ reason: "shown" });
  });
});
