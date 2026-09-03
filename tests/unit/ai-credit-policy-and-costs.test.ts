import { describe, expect, it } from "vitest";
import { AI_CAPABILITIES, isAICapability, resolveCreditCost, resolvePoolOrder } from "@know-finanzas/ai";

describe("AI credit pool policy", () => {
  it("trial access only draws from TRIAL_ALLOWANCE", () => {
    expect(resolvePoolOrder("TRIAL")).toEqual(["TRIAL_ALLOWANCE"]);
  });

  it("pro access draws from PLAN_ALLOWANCE before PURCHASED, and trial credits never appear", () => {
    expect(resolvePoolOrder("PRO")).toEqual(["PLAN_ALLOWANCE", "PURCHASED"]);
  });

  it("expired read-only access has no usable pool", () => {
    expect(resolvePoolOrder("EXPIRED_READ_ONLY")).toEqual([]);
  });
});

describe("AI credit cost catalog", () => {
  it("resolves a stable cost for every known capability", () => {
    for (const capability of AI_CAPABILITIES) {
      expect(resolveCreditCost(capability)).toBeGreaterThan(0);
    }
  });

  it("matches the documented example costs", () => {
    expect(resolveCreditCost("transaction.categorize")).toBe(1);
    expect(resolveCreditCost("capture.parse")).toBe(1);
    expect(resolveCreditCost("merchant.normalize")).toBe(1);
    expect(resolveCreditCost("assistant.query.simple")).toBe(2);
    expect(resolveCreditCost("assistant.query.complex")).toBe(4);
    expect(resolveCreditCost("scenario.simulate")).toBe(4);
    expect(resolveCreditCost("import.map")).toBe(5);
  });

  it("isAICapability narrows unknown strings", () => {
    expect(isAICapability("transaction.categorize")).toBe(true);
    expect(isAICapability("not.a.capability")).toBe(false);
  });
});
