import { describe, expect, it } from "vitest";
import { redactFields } from "@know-finanzas/observability";

describe("redactFields", () => {
  it("redacts common sensitive field names at the top level", () => {
    const result = redactFields({ password: "hunter2", userId: "user-1", description: "buys coffee" });
    expect(result.password).toBe("[REDACTED]");
    expect(result.description).toBe("[REDACTED]");
    expect(result.userId).toBe("user-1");
  });

  it("redacts sensitive keys at any nesting depth without dropping surrounding structure", () => {
    const result = redactFields({ webhook: { headers: { authorization: "Bearer secret" }, eventId: "evt-1" } });
    expect(result).toEqual({ webhook: { headers: { authorization: "[REDACTED]" }, eventId: "evt-1" } });
  });

  it("redacts sensitive keys inside arrays of objects", () => {
    const result = redactFields({ items: [{ notes: "private" }, { notes: "also private" }] });
    expect(result.items).toEqual([{ notes: "[REDACTED]" }, { notes: "[REDACTED]" }]);
  });

  it("matches case-insensitively", () => {
    const result = redactFields({ Password: "x", API_KEY: "y", Description: "z" });
    expect(result).toEqual({ Password: "[REDACTED]", API_KEY: "[REDACTED]", Description: "[REDACTED]" });
  });

  it("redacts an explicit extra key not covered by the built-in pattern", () => {
    const result = redactFields({ favoriteColor: "blue" }, ["favoriteColor"]);
    expect(result.favoriteColor).toBe("[REDACTED]");
  });

  it("leaves non-sensitive nested structures and primitive values intact", () => {
    const result = redactFields({ count: 3, active: true, tags: ["a", "b"], amount: "12.50" });
    expect(result).toEqual({ count: 3, active: true, tags: ["a", "b"], amount: "12.50" });
  });

  it("serializes Date values to ISO strings rather than leaving them as objects", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const result = redactFields({ occurredAt: date });
    expect(result.occurredAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
