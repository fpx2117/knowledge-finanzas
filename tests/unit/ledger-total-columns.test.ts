import { describe, expect, it } from "vitest";

import { buildLedgerTotalColumns, LEDGER_TOTAL_KEYS } from "../../packages/db/src/queries/ledger-totals";
import { transactionTypeEnum } from "../../packages/db/src/schema";

// WP-LEDGER-EXHAUSTIVE: every `transactionTypeEnum` value must map to exactly one balance-total
// column. This is the runtime half of the guard — the compile-time half is the `Record<...>`
// annotation on `TOTAL_KEY_BY_TYPE` in ledger-totals.ts, which fails to typecheck if the enum
// grows without a matching entry.
describe("ledger total columns (WP-LEDGER-EXHAUSTIVE)", () => {
  it("covers every transaction type with no duplicates", () => {
    expect(LEDGER_TOTAL_KEYS).toHaveLength(transactionTypeEnum.enumValues.length);
    expect(new Set(LEDGER_TOTAL_KEYS).size).toBe(LEDGER_TOTAL_KEYS.length);
  });

  it("builds one SQL column per transaction type, including transfers", () => {
    const columns = buildLedgerTotalColumns();
    expect(Object.keys(columns).sort()).toEqual(
      [
        "incomeTotal",
        "expenseTotal",
        "refundTotal",
        "adjustmentInTotal",
        "adjustmentOutTotal",
        "transferInTotal",
        "transferOutTotal",
        "liabilityPaymentTotal",
      ].sort(),
    );
  });
});
