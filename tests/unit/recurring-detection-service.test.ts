import { describe, expect, it } from "vitest";

import { createRecurringDetectionService } from "../../apps/web/src/features/transactions/services/recurring-detection-service";

const NOW = new Date("2026-09-20T12:00:00Z");
const monthly = ["2026-04-05", "2026-05-04", "2026-06-05", "2026-07-06", "2026-08-05", "2026-09-04"];

function expense(over: Record<string, unknown> = {}) {
  return {
    merchantId: "m-spotify",
    merchant: "Spotify",
    description: "Spotify",
    amount: "4599.00",
    currencyCode: "ARS",
    occurredAt: new Date("2026-01-05T12:00:00Z"),
    categoryId: "cat-subs",
    ...over,
  };
}

function fakeSeriesRepo(seed: Array<Record<string, unknown>> = []) {
  let rows = seed.map((r, i) => ({ id: `s${i}`, status: "SUGGESTED", ...r })) as Array<Record<string, unknown>>;
  return {
    rows: () => rows,
    listForUser: async (_userId: string, status?: string) =>
      rows.filter((r) => !status || r.status === status) as never,
    upsertSuggested: async (input: Record<string, unknown>) => {
      const existing = rows.find((r) => r.groupKey === input.groupKey && r.currencyCode === input.currencyCode);
      if (existing) {
        if (existing.status === "SUGGESTED") Object.assign(existing, input, { confidence: String(input.confidence) });
        return existing;
      }
      const row = { id: `s${rows.length}`, status: "SUGGESTED", ...input, confidence: String(input.confidence) };
      rows.push(row);
      return row;
    },
    pruneSuggested: async (_userId: string, keep: string[]) => {
      rows = rows.filter((r) => r.status !== "SUGGESTED" || keep.includes(r.groupKey as string));
    },
    setStatusForUser: async (id: string, _userId: string, status: string) => {
      const row = rows.find((r) => r.id === id);
      if (row) row.status = status;
      return row as never;
    },
    dismissedGroupKeys: async () =>
      rows.filter((r) => r.status === "DISMISSED" || r.status === "CONFIRMED").map((r) => r.groupKey as string),
  };
}

function setup(options: { expenses: Array<Record<string, unknown>>; seed?: Array<Record<string, unknown>> }) {
  const series = fakeSeriesRepo(options.seed);
  const service = createRecurringDetectionService({
    transactions: { listExpensesSinceForUser: async () => options.expenses as never },
    recurringSeries: series as never,
    categories: { listForUser: async () => [{ id: "cat-subs", name: "Suscripciones" }] },
    now: () => NOW,
  });
  return { series, service };
}

describe("recurring detection service", () => {
  it("detects and stores a SUGGESTED series from recent expenses", async () => {
    const { series, service } = setup({ expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })) });
    const result = await service.refreshForUser("user-a");
    expect(result.found).toBe(1);
    expect(series.rows()).toHaveLength(1);
    expect(series.rows()[0]).toMatchObject({ groupKey: "m:m-spotify", label: "Spotify", frequency: "MONTHLY", status: "SUGGESTED" });
  });

  it("never re-suggests a groupKey the user dismissed", async () => {
    const { service, series } = setup({
      expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })),
      seed: [{ groupKey: "m:m-spotify", currencyCode: "ARS", status: "DISMISSED", label: "Spotify", frequency: "MONTHLY", typicalAmount: "4599", occurrenceCount: 6, confidence: "0.9", lastSeenOn: "2026-09-04", nextExpectedOn: "2026-10-04" }],
    });
    const result = await service.refreshForUser("user-a");
    expect(result.found).toBe(0);
    expect(series.rows().filter((r) => r.status === "SUGGESTED")).toHaveLength(0);
  });

  it("prunes a stale SUGGESTED series that is no longer detected", async () => {
    const { service, series } = setup({
      expenses: [],
      seed: [{ groupKey: "m:m-old", currencyCode: "ARS", label: "Viejo", frequency: "MONTHLY", typicalAmount: "1000", occurrenceCount: 4, confidence: "0.7", lastSeenOn: "2026-01-01", nextExpectedOn: "2026-02-01" }],
    });
    await service.refreshForUser("user-a");
    expect(series.rows()).toHaveLength(0);
  });

  it("lists suggestions with the category name resolved", async () => {
    const { service } = setup({ expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })) });
    await service.refreshForUser("user-a");
    const list = await service.listSuggestions("user-a");
    expect(list[0]).toMatchObject({ label: "Spotify", categoryName: "Suscripciones", frequency: "MONTHLY" });
  });

  it("confirm and dismiss move the series out of the suggestion list", async () => {
    const { service, series } = setup({ expenses: monthly.map((d) => expense({ occurredAt: new Date(`${d}T12:00:00Z`) })) });
    await service.refreshForUser("user-a");
    const [s] = await service.listSuggestions("user-a");
    await service.confirmSuggestion("user-a", s.id);
    expect(series.rows()[0].status).toBe("CONFIRMED");
    expect(await service.listSuggestions("user-a")).toHaveLength(0);
  });
});
