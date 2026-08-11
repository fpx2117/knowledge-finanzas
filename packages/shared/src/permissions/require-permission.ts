import { ApplicationError } from "../errors";
import { hasPermission } from "./role-permissions";
import type { PermissionKey } from "./permission-keys";
import type { AdminRole } from "./roles";

// The single guard every admin Server Action calls before doing anything else — client-declared
// role is never trusted (domain rule); `role` here must always come from a server-resolved
// session/admin_roles lookup, never from form input or a header.
export function requirePermission(role: AdminRole | null, permission: PermissionKey): void {
  if (!hasPermission(role, permission)) throw new ApplicationError("FORBIDDEN");
}
