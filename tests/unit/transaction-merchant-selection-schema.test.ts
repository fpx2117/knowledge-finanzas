import { describe, expect, it } from "vitest";

import { createExpenseTransactionSchema } from "../../apps/web/src/features/transactions/schemas/transaction-schemas";

const input = {
  accountId: "10000000-0000-4000-8000-000000000001",
  amount: "100.50",
  description: "Carrefour",
  occurredAt: "2026-09-03T12:00:00Z",
  merchant: "Carrefour",
};

describe("expense merchant selection schema", () => {
  it("acepta la identidad canónica seleccionada", () => {
    expect(createExpenseTransactionSchema.safeParse({
      ...input,
      merchantId: "20000000-0000-4000-8000-000000000001",
    }).success).toBe(true);
  });

  it("rechaza merchant IDs inválidos en la frontera del servidor", () => {
    expect(createExpenseTransactionSchema.safeParse({ ...input, merchantId: "not-an-id" }).success).toBe(false);
  });
});
