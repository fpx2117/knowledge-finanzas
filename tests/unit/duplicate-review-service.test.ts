import { describe, expect, it } from "vitest";

import { createDuplicateReviewService } from "../../apps/web/src/features/transactions/services/duplicate-review-service";

const NOW = new Date("2026-09-20T12:00:00Z");

function row(over: Record<string, unknown> = {}) {
  return {
    id: "a",
    type: "EXPENSE",
    accountId: "acc-1",
    description: "Carrefour",
    merchant: "Carrefour",
    merchantId: "m-1",
    amount: "15400.000000",
    currencyCode: "ARS",
    occurredAt: new Date("2026-09-03T00:00:00Z"),
    paymentMethod: "DEBIT",
    ...over,
  };
}

function setup(options: { rows: Array<Record<string, unknown>>; dismissed?: string[] }) {
  const voided: string[] = [];
  const dismissed: string[] = [...(options.dismissed ?? [])];
  const service = createDuplicateReviewService({
    transactions: {
      listPostedForDuplicateScan: async () => options.rows as never,
      findByIdForUser: async (id: string) => ({ id, status: "POSTED" as const }),
      voidForUser: async (id: string) => { voided.push(id); },
    },
    dismissals: {
      listKeysForUser: async () => dismissed,
      dismiss: async (_u: string, a: string, b: string) => { dismissed.push(a < b ? `${a}:${b}` : `${b}:${a}`); },
    },
    now: () => NOW,
  });
  return { service, voided, dismissed };
}

describe("duplicate review service", () => {
  it("surfaces a near-certain duplicate pair", async () => {
    const { service } = setup({ rows: [row({ id: "a" }), row({ id: "b" })] });
    const pairs = await service.scanForUser("user-a");
    expect(pairs).toHaveLength(1);
    expect(pairs[0].score).toBeGreaterThanOrEqual(0.85);
    expect([pairs[0].a.id, pairs[0].b.id].sort()).toEqual(["a", "b"]);
  });

  it("does not pair transactions in different amount buckets", async () => {
    const { service } = setup({ rows: [row({ id: "a" }), row({ id: "b", amount: "99999.00" })] });
    expect(await service.scanForUser("user-a")).toEqual([]);
  });

  it("does not pair an income with an expense of the same amount", async () => {
    const { service } = setup({ rows: [row({ id: "a" }), row({ id: "b", type: "INCOME" })] });
    expect(await service.scanForUser("user-a")).toEqual([]);
  });

  it("hides a pair the user already dismissed", async () => {
    const { service } = setup({ rows: [row({ id: "a" }), row({ id: "b" })], dismissed: ["a:b"] });
    expect(await service.scanForUser("user-a")).toEqual([]);
  });

  it("resolvePair voids the target and remembers the pair", async () => {
    const { service, voided, dismissed } = setup({ rows: [row({ id: "a" }), row({ id: "b" })] });
    await service.resolvePair("user-a", "a", "b");
    expect(voided).toEqual(["b"]);
    expect(dismissed).toContain("a:b");
  });

  it("only emits each pair once even across a larger bucket", async () => {
    const { service } = setup({ rows: [row({ id: "a" }), row({ id: "b" }), row({ id: "c" })] });
    const pairs = await service.scanForUser("user-a");
    expect(pairs).toHaveLength(3); // a-b, a-c, b-c
    expect(new Set(pairs.map((p) => [p.a.id, p.b.id].sort().join(":"))).size).toBe(3);
  });
});
