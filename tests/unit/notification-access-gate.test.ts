import { describe, expect, it } from "vitest";
import { isRuleEligibleForAccess } from "@know-finanzas/notifications";

describe("isRuleEligibleForAccess", () => {
  it("blocks FINANCIAL and PRODUCT categories once premium access has expired", () => {
    expect(isRuleEligibleForAccess("FINANCIAL", false)).toBe(false);
    expect(isRuleEligibleForAccess("PRODUCT", false)).toBe(false);
  });

  it("allows FINANCIAL and PRODUCT categories while premium access is active", () => {
    expect(isRuleEligibleForAccess("FINANCIAL", true)).toBe(true);
    expect(isRuleEligibleForAccess("PRODUCT", true)).toBe(true);
  });

  it("never gates BILLING, SECURITY or ACCOUNT categories, regardless of access state", () => {
    for (const category of ["BILLING", "SECURITY", "ACCOUNT"] as const) {
      expect(isRuleEligibleForAccess(category, false)).toBe(true);
      expect(isRuleEligibleForAccess(category, true)).toBe(true);
    }
  });
});
