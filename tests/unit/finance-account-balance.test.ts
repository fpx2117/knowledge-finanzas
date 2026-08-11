import { describe, expect, it } from "vitest";
import { calculateAssetAccountBalance } from "@know-finanzas/finance";

describe("asset account balance", () => {
  it("derives opening balance plus income minus expense", () => {
    expect(calculateAssetAccountBalance({
      currency: "ARS",
      openingBalance: "1000",
      incomeTotal: "500",
      expenseTotal: "200",
    }).toString()).toBe("1300.00");
  });

  it("supports an opening balance of zero without creating income", () => {
    expect(calculateAssetAccountBalance({
      currency: "USD",
      openingBalance: "0",
      incomeTotal: "0",
      expenseTotal: "0",
    }).toString()).toBe("0.00");
  });
});
