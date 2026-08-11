import { createAdminRoleRepository, db } from "@know-finanzas/db";
import { requirePermission, type AdminRole, type PermissionKey } from "@know-finanzas/shared";
import { requireCurrentUser } from "./require-current-user";

const adminRoles = createAdminRoleRepository(db);

export type AdminUser = { id: string; email: string; timezone: string; role: AdminRole };

// The one place that resolves "is this session an admin, and with which role" — every admin
// Server Action and page calls this (optionally with a required permission) rather than trusting
// anything the client claims (Domain Rule: "client-declared role is never trusted").
export async function requireAdminUser(permission?: PermissionKey): Promise<AdminUser> {
  const user = await requireCurrentUser();
  const roleRow = await adminRoles.findRoleForUser(user.id);
  const role = roleRow?.role ?? null;

  if (permission) requirePermission(role, permission);
  else requirePermission(role, "commercial.users.read");

  return { id: user.id, email: user.email, timezone: user.timezone, role: role! };
}
