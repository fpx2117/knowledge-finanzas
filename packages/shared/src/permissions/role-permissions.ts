import type { PermissionKey } from "./permission-keys";
import type { AdminRole } from "./roles";

// SUPPORT is deliberately read-only (task's data-minimization default) — every write permission
// requires ADMIN or above. SUPER_ADMIN currently has the same permission surface as ADMIN; it
// exists as a rank ahead of ADMIN for sensitive overrides/configuration future tasks will add
// (docs/21-commercial-admin.md), not because any permission here is SUPER_ADMIN-exclusive yet.
const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<PermissionKey>> = {
  SUPPORT: new Set(["commercial.users.read", "commercial.audit.read"]),
  // commercial.metrics.read (TASK-046) is deliberately withheld from SUPPORT — business
  // cost/pricing/margin data is more sensitive than the individual user records SUPPORT already
  // reads, and this task's own Security Requirement scopes it to admin-only.
  ADMIN: new Set(["commercial.users.read", "commercial.audit.read", "billing.manage", "billing.refund.execute", "promotions.manage", "ai.adjust", "notifications.manage", "referrals.invalidate", "commercial.metrics.read"]),
  // Webhook replay is the one SUPER_ADMIN-exclusive permission today (Security Requirement:
  // "Webhook replay is restricted to SUPER_ADMIN") — it can re-drive arbitrary provider-sourced
  // state changes, which is a materially different risk than the already-guarded actions above.
  SUPER_ADMIN: new Set(["commercial.users.read", "commercial.audit.read", "billing.manage", "billing.refund.execute", "billing.webhook.replay", "promotions.manage", "ai.adjust", "notifications.manage", "referrals.invalidate", "commercial.metrics.read"]),
};

export function hasPermission(role: AdminRole | null, permission: PermissionKey): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].has(permission);
}
