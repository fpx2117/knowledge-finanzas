import { ADMIN_ROLES, meetsMinimumRole, type AdminRole } from "@know-finanzas/shared";

// Re-exported from this package (rather than importing @know-finanzas/shared directly at every
// call site) because "which roles exist and how they compare" is conceptually an auth-layer
// concern — this app's session/admin lookups live here, even though the role vocabulary itself
// is defined in the dependency-free shared package so packages/shared/permissions doesn't need
// to depend on packages/auth.
export { ADMIN_ROLES, meetsMinimumRole, type AdminRole };

export type AdminActor = { userId: string; role: AdminRole };

// Deliberately no lookup function here: resolving "what is this session's admin role" requires
// a database read (the admin_roles table, packages/db/src/repositories/admin-roles.ts) and a
// Better Auth session (apps/web/src/lib/auth/require-admin-user.ts) — both live above this
// package in the dependency graph, so this file only ever exports the pure role vocabulary.
