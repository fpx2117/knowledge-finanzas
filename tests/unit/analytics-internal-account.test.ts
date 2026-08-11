import { describe, expect, it } from "vitest";
import { isInternalAccountEmail } from "@know-finanzas/analytics";

describe("isInternalAccountEmail", () => {
  it("treats any @*.test address as internal by default (this repo's own seed/E2E convention)", () => {
    expect(isInternalAccountEmail("user@example.test")).toBe(true);
    expect(isInternalAccountEmail("e2e-123@example.test")).toBe(true);
  });

  it("treats a real-looking address as not internal by default", () => {
    expect(isInternalAccountEmail("real.user@gmail.com")).toBe(false);
  });

  it("treats a configured staff domain as internal", () => {
    expect(isInternalAccountEmail("staff@knowfinanzas.com", ["knowfinanzas.com"])).toBe(true);
  });

  it("is case-insensitive on the domain", () => {
    expect(isInternalAccountEmail("user@EXAMPLE.TEST")).toBe(true);
  });
});
