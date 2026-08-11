import { describe, expect, it } from "vitest";
import { generateReferralCode } from "@know-finanzas/referrals";

describe("generateReferralCode", () => {
  it("generates an 8-character code from an unambiguous alphabet", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it("excludes visually ambiguous characters (0, O, 1, I, L)", () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it("uses the injected random source deterministically", () => {
    const code = generateReferralCode(() => 0);
    expect(code).toBe("AAAAAAAA");
  });
});
