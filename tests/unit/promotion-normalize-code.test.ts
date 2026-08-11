import { describe, expect, it } from "vitest";
import { normalizePromotionCode, PromotionError } from "@know-finanzas/promotions";

describe("normalizePromotionCode", () => {
  it("uppercases and trims a valid code", () => {
    expect(normalizePromotionCode("  welcome30  ")).toBe("WELCOME30");
  });

  it("accepts a code already using the restricted alphabet including hyphens", () => {
    expect(normalizePromotionCode("PROMO-2026")).toBe("PROMO-2026");
  });

  it("rejects a code shorter than 4 characters", () => {
    expect(() => normalizePromotionCode("AB1")).toThrow("PROMOTION_INVALID");
  });

  it("rejects a code longer than 32 characters", () => {
    expect(() => normalizePromotionCode("A".repeat(33))).toThrow("PROMOTION_INVALID");
  });

  it("rejects a code with characters outside A-Z0-9-", () => {
    expect(() => normalizePromotionCode("WELCOME_30")).toThrow("PROMOTION_INVALID");
    expect(() => normalizePromotionCode("WELCOME 30")).toThrow("PROMOTION_INVALID");
    expect(() => normalizePromotionCode("wélcome30")).toThrow("PROMOTION_INVALID");
  });

  it("throws a PromotionError with the invalid code", () => {
    try {
      normalizePromotionCode("");
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(PromotionError);
      expect((error as PromotionError).code).toBe("PROMOTION_INVALID");
    }
  });
});
