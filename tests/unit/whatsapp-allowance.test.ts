import { describe, expect, it } from "vitest";
import { isWithinWhatsAppAllowance } from "@know-finanzas/notifications";

describe("isWithinWhatsAppAllowance", () => {
  it("allows a TRIAL user under the total cap", () => {
    expect(isWithinWhatsAppAllowance({ state: "TRIAL", sentCount: 2, trialTotal: 3, proPerPeriod: 20 })).toBe(true);
  });

  it("blocks a TRIAL user exactly at the total cap", () => {
    expect(isWithinWhatsAppAllowance({ state: "TRIAL", sentCount: 3, trialTotal: 3, proPerPeriod: 20 })).toBe(false);
  });

  it("allows a PRO user under the per-period cap", () => {
    expect(isWithinWhatsAppAllowance({ state: "PRO", sentCount: 19, trialTotal: 3, proPerPeriod: 20 })).toBe(true);
  });

  it("blocks a PRO user exactly at the per-period cap", () => {
    expect(isWithinWhatsAppAllowance({ state: "PRO", sentCount: 20, trialTotal: 3, proPerPeriod: 20 })).toBe(false);
  });

  it("PRO and TRIAL caps are independent of each other", () => {
    expect(isWithinWhatsAppAllowance({ state: "PRO", sentCount: 3, trialTotal: 3, proPerPeriod: 20 })).toBe(true);
  });
});
