import { describe, expect, it } from "vitest";

import { detectRecurringSeries, type RecurringTxn } from "../../apps/web/src/features/transactions/lib/detect-recurring";

const NOW = "2026-09-15";

function txn(over: Partial<RecurringTxn>): RecurringTxn {
  return {
    merchantId: "m-spotify",
    merchant: "Spotify",
    description: "Spotify",
    amount: "4599.00",
    currencyCode: "ARS",
    occurredOn: "2026-01-05",
    categoryId: "cat-subs",
    ...over,
  };
}

// Monthly-ish dates spanning several months.
const monthly = ["2026-04-05", "2026-05-04", "2026-06-05", "2026-07-06", "2026-08-05", "2026-09-04"];

describe("detectRecurringSeries", () => {
  it("detects a stable monthly subscription", () => {
    const result = detectRecurringSeries(monthly.map((d) => txn({ occurredOn: d })), { now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      label: "Spotify",
      merchantId: "m-spotify",
      frequency: "MONTHLY",
      typicalAmount: "4599.00",
      currencyCode: "ARS",
      categoryId: "cat-subs",
      occurrenceCount: 6,
    });
    expect(result[0].confidence).toBeGreaterThan(0.7);
    expect(result[0].lastSeenOn).toBe("2026-09-04");
    expect(result[0].nextExpectedOn).toBe("2026-10-04");
  });

  it("ignores groups with fewer than 3 occurrences", () => {
    expect(detectRecurringSeries(monthly.slice(0, 2).map((d) => txn({ occurredOn: d })), { now: NOW })).toEqual([]);
  });

  it("ignores irregular intervals", () => {
    const irregular = ["2026-02-01", "2026-02-20", "2026-06-15", "2026-09-01"];
    expect(detectRecurringSeries(irregular.map((d) => txn({ occurredOn: d })), { now: NOW })).toEqual([]);
  });

  it("ignores groups whose amount swings too much", () => {
    const amounts = ["1000", "1050", "9000", "1100", "1080", "1020"];
    const rows = monthly.map((d, i) => txn({ occurredOn: d, amount: amounts[i] }));
    expect(detectRecurringSeries(rows, { now: NOW })).toEqual([]);
  });

  it("skips a series that has clearly lapsed", () => {
    const old = ["2025-01-05", "2025-02-05", "2025-03-05", "2025-04-05"];
    expect(detectRecurringSeries(old.map((d) => txn({ occurredOn: d })), { now: NOW })).toEqual([]);
  });

  it("groups by normalized description when there is no merchant", () => {
    const rows = monthly.map((d) => txn({ occurredOn: d, merchantId: null, merchant: null, description: "  GIMNASIO  Sparta " }));
    const result = detectRecurringSeries(rows, { now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].merchantId).toBeNull();
    expect(result[0].groupKey.startsWith("d:")).toBe(true);
  });

  it("detects a weekly cadence", () => {
    const weekly = ["2026-08-03", "2026-08-10", "2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07"];
    const result = detectRecurringSeries(weekly.map((d) => txn({ occurredOn: d, amount: "3000" })), { now: NOW });
    expect(result[0]?.frequency).toBe("WEEKLY");
  });

  it("keeps distinct merchants separate and sorts by confidence", () => {
    const rows = [
      ...monthly.map((d) => txn({ occurredOn: d })),
      ...monthly.slice(0, 4).map((d) => txn({ occurredOn: d, merchantId: "m-netflix", merchant: "Netflix", description: "Netflix", amount: "8500" })),
    ];
    const result = detectRecurringSeries(rows, { now: NOW });
    expect(result.map((r) => r.label)).toEqual(["Spotify", "Netflix"]);
  });
});
