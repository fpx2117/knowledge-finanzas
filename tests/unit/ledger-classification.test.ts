import { describe, expect, it } from "vitest";
import { calculateRemainingRefundable, classifyLedgerEffect } from "@know-finanzas/finance";

describe("refund and adjustment ledger classification", () => {
  it("refunds increase balance but reduce consumption, never ordinary income", () => {
    const effect = classifyLedgerEffect({ type: "REFUND", status: "POSTED", amount: "40", currency: "ARS" });
    expect(effect.economicClass).toBe("REFUND");
    expect(effect.balanceDelta.toString()).toBe("40.00");
    expect(effect.consumptionDelta.toString()).toBe("-40.00");
  });

  it("adjustments affect balance without becoming income or expense", () => {
    expect(classifyLedgerEffect({ type: "ADJUSTMENT_IN", status: "POSTED", amount: "20", currency: "ARS" }).balanceDelta.toString()).toBe("20.00");
    expect(classifyLedgerEffect({ type: "ADJUSTMENT_OUT", status: "POSTED", amount: "5", currency: "ARS" }).balanceDelta.toString()).toBe("-5.00");
  });

  it("voided events have zero effect and refunds retain remaining capacity", () => {
    expect(classifyLedgerEffect({ type: "REFUND", status: "VOIDED", amount: "40", currency: "ARS" }).balanceDelta.toString()).toBe("0.00");
    expect(calculateRemainingRefundable("100", ["40", "10"], "ARS").toString()).toBe("50.00");
  });
});
