import { describe, expect, it } from "vitest";

import { describeRule, matchClassificationRule, type ClassificationRule } from "../../apps/web/src/features/transactions/lib/classification-rules";

const rule = (over: Partial<ClassificationRule>): ClassificationRule => ({
  id: "r", matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf", categoryId: "cat-fuel", priority: 100, ...over,
});

describe("matchClassificationRule", () => {
  it("matches a merchant substring case-insensitively", () => {
    expect(matchClassificationRule([rule({})], { merchant: "MERPAGO*YPF 2234" })?.categoryId).toBe("cat-fuel");
  });

  it("matches on the description when the matcher is DESCRIPTION", () => {
    const r = rule({ matcher: "DESCRIPTION", pattern: "honorarios", categoryId: "cat-income" });
    expect(matchClassificationRule([r], { description: "Pago de HONORARIOS marzo" })?.categoryId).toBe("cat-income");
    expect(matchClassificationRule([r], { merchant: "honorarios" })).toBeNull();
  });

  it("honours EQUALS and STARTS_WITH modes", () => {
    expect(matchClassificationRule([rule({ mode: "EQUALS" })], { merchant: "ypf" })?.id).toBe("r");
    expect(matchClassificationRule([rule({ mode: "EQUALS" })], { merchant: "ypf servicios" })).toBeNull();
    expect(matchClassificationRule([rule({ mode: "STARTS_WITH" })], { merchant: "ypf servicios" })?.id).toBe("r");
    expect(matchClassificationRule([rule({ mode: "STARTS_WITH" })], { merchant: "la ypf" })).toBeNull();
  });

  it("returns the first matching rule (list is priority-ordered)", () => {
    const a = rule({ id: "a", pattern: "ypf", categoryId: "cat-a" });
    const b = rule({ id: "b", pattern: "y", categoryId: "cat-b" });
    expect(matchClassificationRule([a, b], { merchant: "ypf" })?.id).toBe("a");
    expect(matchClassificationRule([b, a], { merchant: "ypf" })?.id).toBe("b");
  });

  it("ignores empty haystacks and patterns", () => {
    expect(matchClassificationRule([rule({ pattern: "" })], { merchant: "ypf" })).toBeNull();
    expect(matchClassificationRule([rule({})], { merchant: "" })).toBeNull();
  });
});

describe("describeRule", () => {
  it("phrases a rule in plain Spanish", () => {
    expect(describeRule({ matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf" })).toBe("el comercio contiene «ypf»");
    expect(describeRule({ matcher: "DESCRIPTION", mode: "EQUALS", pattern: "alquiler" })).toBe("la descripción es «alquiler»");
  });
});
