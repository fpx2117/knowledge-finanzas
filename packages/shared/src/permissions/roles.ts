// SUPPORT: inspect/diagnose only. ADMIN: controlled commercial actions (refunds, promotions,
// AI adjustments, referral invalidation). SUPER_ADMIN: everything ADMIN has, reserved for
// sensitive overrides/configuration as those land in future tasks (docs/21-commercial-admin.md).
export const ADMIN_ROLES = ["SUPPORT", "ADMIN", "SUPER_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

// Higher rank strictly implies every permission of every lower rank (see role-permissions.ts).
const ADMIN_ROLE_RANK: Record<AdminRole, number> = { SUPPORT: 0, ADMIN: 1, SUPER_ADMIN: 2 };

export function meetsMinimumRole(role: AdminRole | null, minimum: AdminRole): boolean {
  if (!role) return false;
  return ADMIN_ROLE_RANK[role] >= ADMIN_ROLE_RANK[minimum];
}
