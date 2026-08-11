import { describe, expect, it } from "vitest";
import { isRefundable, maxRefundableAmount, resolveRefundAccessEffect } from "@know-finanzas/billing";

describe("isRefundable", () => {
  it("allows refunding an APPROVED payment", () => {
    expect(isRefundable({ status: "APPROVED" })).toBe(true);
  });

  it("rejects PENDING, REJECTED, CANCELLED and already-REFUNDED payments", () => {
    expect(isRefundable({ status: "PENDING" })).toBe(false);
    expect(isRefundable({ status: "REJECTED" })).toBe(false);
    expect(isRefundable({ status: "CANCELLED" })).toBe(false);
    expect(isRefundable({ status: "REFUNDED" })).toBe(false);
  });
});

describe("maxRefundableAmount", () => {
  it("is always the payment's full gross amount (V1 full-refund-only scope)", () => {
    expect(maxRefundableAmount({ grossAmount: "7.99" })).toBe("7.99");
  });
});

describe("resolveRefundAccessEffect", () => {
  it("DUPLICATE_CHARGE always keeps access", () => {
    expect(resolveRefundAccessEffect("DUPLICATE_CHARGE")).toBe("KEEP_ACCESS");
    expect(resolveRefundAccessEffect("DUPLICATE_CHARGE", { revokeAccess: true })).toBe("KEEP_ACCESS");
  });

  it("FULL_SUBSCRIPTION_REVERSAL always revokes access", () => {
    expect(resolveRefundAccessEffect("FULL_SUBSCRIPTION_REVERSAL")).toBe("REVOKE_ACCESS");
    expect(resolveRefundAccessEffect("FULL_SUBSCRIPTION_REVERSAL", { revokeAccess: false })).toBe("REVOKE_ACCESS");
  });

  it("SERVICE_FAILURE follows the admin's explicit decision, defaulting to keeping access", () => {
    expect(resolveRefundAccessEffect("SERVICE_FAILURE")).toBe("KEEP_ACCESS");
    expect(resolveRefundAccessEffect("SERVICE_FAILURE", { revokeAccess: false })).toBe("KEEP_ACCESS");
    expect(resolveRefundAccessEffect("SERVICE_FAILURE", { revokeAccess: true })).toBe("REVOKE_ACCESS");
  });
});
