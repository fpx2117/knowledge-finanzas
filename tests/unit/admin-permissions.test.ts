import { describe, expect, it } from "vitest";
import { ADMIN_ROLES, ApplicationError, hasPermission, meetsMinimumRole, requirePermission, type AdminRole, type PermissionKey } from "@know-finanzas/shared";

describe("hasPermission", () => {
  it("SUPPORT can read commercial data and the audit log but nothing else", () => {
    expect(hasPermission("SUPPORT", "commercial.users.read")).toBe(true);
    expect(hasPermission("SUPPORT", "commercial.audit.read")).toBe(true);
    expect(hasPermission("SUPPORT", "billing.refund.execute")).toBe(false);
    expect(hasPermission("SUPPORT", "promotions.manage")).toBe(false);
    expect(hasPermission("SUPPORT", "ai.adjust")).toBe(false);
    expect(hasPermission("SUPPORT", "referrals.invalidate")).toBe(false);
    // TASK-046: business cost/pricing/margin data is more sensitive than the commercial user
    // records SUPPORT already reads — withheld here on purpose.
    expect(hasPermission("SUPPORT", "commercial.metrics.read")).toBe(false);
  });

  it("only ADMIN and SUPER_ADMIN can read business metrics (TASK-046)", () => {
    expect(hasPermission("ADMIN", "commercial.metrics.read")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "commercial.metrics.read")).toBe(true);
    expect(hasPermission(null, "commercial.metrics.read")).toBe(false);
  });

  it("ADMIN and SUPER_ADMIN can perform every declared mutating action", () => {
    const mutatingPermissions: PermissionKey[] = ["billing.refund.execute", "promotions.manage", "ai.adjust", "referrals.invalidate"];
    for (const permission of mutatingPermissions) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
      expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("a null role (no admin_roles row) has no permissions at all", () => {
    for (const permission of ["commercial.users.read", "commercial.audit.read", "billing.refund.execute", "promotions.manage", "ai.adjust", "referrals.invalidate"] as PermissionKey[]) {
      expect(hasPermission(null, permission)).toBe(false);
    }
  });

  it("covers every declared role from ADMIN_ROLES with at least commercial.users.read", () => {
    for (const role of ADMIN_ROLES) {
      expect(hasPermission(role, "commercial.users.read")).toBe(true);
    }
  });
});

describe("requirePermission", () => {
  it("throws FORBIDDEN when the role lacks the permission", () => {
    expect(() => requirePermission("SUPPORT", "promotions.manage")).toThrow("FORBIDDEN");
  });

  it("throws FORBIDDEN for a null role regardless of the permission requested", () => {
    expect(() => requirePermission(null, "commercial.users.read")).toThrow("FORBIDDEN");
  });

  it("does not throw when the role has the permission", () => {
    expect(() => requirePermission("ADMIN", "promotions.manage")).not.toThrow();
  });

  it("throws an ApplicationError instance, not a bare Error", () => {
    try {
      requirePermission("SUPPORT", "ai.adjust");
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      expect((error as ApplicationError).code).toBe("FORBIDDEN");
    }
  });
});

describe("meetsMinimumRole", () => {
  it("orders SUPPORT < ADMIN < SUPER_ADMIN", () => {
    expect(meetsMinimumRole("SUPPORT", "SUPPORT")).toBe(true);
    expect(meetsMinimumRole("SUPPORT", "ADMIN")).toBe(false);
    expect(meetsMinimumRole("ADMIN", "SUPPORT")).toBe(true);
    expect(meetsMinimumRole("ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(meetsMinimumRole("SUPER_ADMIN", "ADMIN")).toBe(true);
  });

  it("a null role never meets any minimum", () => {
    const roles: AdminRole[] = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
    for (const minimum of roles) {
      expect(meetsMinimumRole(null, minimum)).toBe(false);
    }
  });
});
