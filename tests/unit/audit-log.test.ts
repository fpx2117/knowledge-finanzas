import { describe, expect, it, vi } from "vitest";
import { createRecordAuditEntry, redactSnapshot, requireReason, type AuditLogRepository } from "@know-finanzas/audit";
import { ApplicationError } from "@know-finanzas/shared";

describe("redactSnapshot", () => {
  it("redacts top-level keys matching secret-shaped names", () => {
    const result = redactSnapshot({ password: "hunter2", apiKey: "sk-abc", token: "xyz", name: "ok" });
    expect(result).toEqual({ password: "[REDACTED]", apiKey: "[REDACTED]", token: "[REDACTED]", name: "ok" });
  });

  it("redacts nested keys inside objects and arrays", () => {
    const result = redactSnapshot({ provider: { access_token: "abc", accountId: "1" }, items: [{ secret: "s" }, { name: "ok" }] });
    expect(result).toEqual({ provider: { access_token: "[REDACTED]", accountId: "1" }, items: [{ secret: "[REDACTED]" }, { name: "ok" }] });
  });

  it("is case-insensitive and matches partial key names", () => {
    expect(redactSnapshot({ Authorization: "Bearer x", clientSecret: "y", MERCADOPAGO_ACCESS_TOKEN: "z" }))
      .toEqual({ Authorization: "[REDACTED]", clientSecret: "[REDACTED]", MERCADOPAGO_ACCESS_TOKEN: "[REDACTED]" });
  });

  it("passes through primitives and null unchanged", () => {
    expect(redactSnapshot(null)).toBeNull();
    expect(redactSnapshot("plain string")).toBe("plain string");
    expect(redactSnapshot(42)).toBe(42);
  });
});

describe("createRecordAuditEntry", () => {
  it("redacts both before/after snapshots before handing them to the repository", async () => {
    const repository: AuditLogRepository = { record: vi.fn(async (input) => ({ id: "audit-1", createdAt: new Date(), ...input })) };
    const recordAuditEntry = createRecordAuditEntry({ repository });

    await recordAuditEntry({
      actorUserId: "admin-1",
      action: "GRANT_PROMOTIONAL_ACCESS",
      entityType: "promotional_access_grant",
      entityId: "grant-1",
      targetUserId: "user-1",
      beforeSnapshot: { status: "NONE" },
      afterSnapshot: { status: "ACTIVE", providerToken: "should-not-appear" },
      reason: "support case #123",
    });

    expect(repository.record).toHaveBeenCalledWith(expect.objectContaining({
      afterSnapshot: { status: "ACTIVE", providerToken: "[REDACTED]" },
      reason: "support case #123",
    }));
  });

  it("defaults optional fields to null rather than leaving them undefined", async () => {
    const repository: AuditLogRepository = { record: vi.fn(async (input) => ({ id: "audit-1", createdAt: new Date(), ...input })) };
    const recordAuditEntry = createRecordAuditEntry({ repository });

    await recordAuditEntry({ actorUserId: "admin-1", action: "VIEW_SUMMARY", entityType: "user", entityId: null });

    expect(repository.record).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: null, beforeSnapshot: null, afterSnapshot: null, reason: null }));
  });
});

describe("requireReason", () => {
  it("returns the trimmed reason when present", () => {
    expect(requireReason("  a real reason  ")).toBe("a real reason");
  });

  it("throws ADMIN_REASON_REQUIRED for null, undefined, empty, or whitespace-only reasons", () => {
    for (const reason of [null, undefined, "", "   "]) {
      expect(() => requireReason(reason)).toThrow("ADMIN_REASON_REQUIRED");
    }
  });

  it("throws an ApplicationError instance", () => {
    try {
      requireReason(null);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
    }
  });
});
