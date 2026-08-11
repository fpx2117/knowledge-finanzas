import { describe, expect, it } from "vitest";
import { generateRequestId, resolveRequestId } from "@know-finanzas/observability";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("generateRequestId", () => {
  it("generates a UUID", () => {
    expect(generateRequestId()).toMatch(UUID_PATTERN);
  });

  it("generates a different ID on each call", () => {
    expect(generateRequestId()).not.toBe(generateRequestId());
  });
});

describe("resolveRequestId", () => {
  it("trusts an incoming value that looks like a UUID", () => {
    const incoming = "123e4567-e89b-12d3-a456-426614174000";
    expect(resolveRequestId(incoming)).toBe(incoming);
  });

  it("generates a fresh ID when the incoming value is missing", () => {
    expect(resolveRequestId(null)).toMatch(UUID_PATTERN);
    expect(resolveRequestId(undefined)).toMatch(UUID_PATTERN);
  });

  it("never trusts a non-UUID value (log injection guard)", () => {
    const malicious = "not-a-uuid\nfake_field=injected";
    const resolved = resolveRequestId(malicious);
    expect(resolved).not.toBe(malicious);
    expect(resolved).toMatch(UUID_PATTERN);
  });
});
