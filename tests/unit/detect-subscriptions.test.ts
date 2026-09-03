import { describe, expect, it } from "vitest";

import {
  buildPriceHistory,
  detectSubscriptions,
  priceChangeImpact,
} from "../../apps/web/src/features/transactions/lib/detect-subscriptions";
import type { RecurringTxn } from "../../apps/web/src/features/transactions/lib/detect-recurring";

const NOW = "2026-09-20";
const monthly = ["2026-03-05", "2026-04-04", "2026-05-05", "2026-06-05", "2026-07-06", "2026-08-05", "2026-09-04"];

function txn(over: Partial<RecurringTxn>): RecurringTxn {
  return {
    merchantId: "m-netflix",
    merchant: "Netflix",
    description: "Netflix",
    amount: "18499.00",
    currencyCode: "ARS",
    occurredOn: "2026-03-05",
    categoryId: "cat-streaming",
    ...over,
  };
}

describe("buildPriceHistory", () => {
  it("collapses stable charges into one tier and records a hike", () => {
    const tiers = buildPriceHistory([
      { amount: "18499.00", on: "2026-01-01" },
      { amount: "18499.00", on: "2026-02-01" },
      { amount: "18500.10", on: "2026-03-01" },
      { amount: "21999.00", on: "2026-04-01" },
      { amount: "21999.00", on: "2026-05-01" },
    ]);
    expect(tiers).toEqual([
      { amount: "18499.00", from: "2026-01-01" },
      { amount: "21999.00", from: "2026-04-01" },
    ]);
  });
});

describe("priceChangeImpact", () => {
  it("annualises a monthly delta", () => {
    expect(priceChangeImpact("MONTHLY", 3500)).toEqual({ monthly: 3500, yearly: 42000 });
  });
  it("spreads a yearly delta across months", () => {
    expect(priceChangeImpact("YEARLY", 12000)).toEqual({ monthly: 1000, yearly: 12000 });
  });
});

describe("detectSubscriptions", () => {
  it("detects a monthly subscription with a mid-history price increase", () => {
    const rows = monthly.map((d, i) => txn({ occurredOn: d, amount: i < 4 ? "18499.00" : "21999.00" }));
    const result = detectSubscriptions(rows, { now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      merchantId: "m-netflix",
      label: "Netflix",
      frequency: "MONTHLY",
      currentAmount: "21999.00",
      previousAmount: "18499.00",
      chargeCount: 7,
    });
    expect(result[0].priceHistory).toHaveLength(2);
    expect(result[0].nextExpectedOn).toBe("2026-10-04");
  });

  it("ignores a weekly recurring charge (not a subscription cadence)", () => {
    const weekly = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07"];
    expect(detectSubscriptions(weekly.map((d) => txn({ occurredOn: d, amount: "3000" })), { now: NOW })).toEqual([]);
  });

  it("ignores charges with no merchant", () => {
    expect(detectSubscriptions(monthly.map((d) => txn({ occurredOn: d, merchantId: null, merchant: null })), { now: NOW })).toEqual([]);
  });

  it("rejects a group whose price drops repeatedly (not a subscription)", () => {
    const amounts = ["20000", "12000", "20000", "8000", "20000", "5000", "20000"];
    const rows = monthly.map((d, i) => txn({ occurredOn: d, amount: amounts[i] }));
    expect(detectSubscriptions(rows, { now: NOW })).toEqual([]);
  });

  it("skips a subscription that lapsed months ago", () => {
    const old = ["2025-01-05", "2025-02-05", "2025-03-05", "2025-04-05"];
    expect(detectSubscriptions(old.map((d) => txn({ occurredOn: d })), { now: NOW })).toEqual([]);
  });
});
