import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { adminRoles } from "../schema";

export function createAdminRoleRepository(database: Database) {
  return {
    findRoleForUser(userId: string) {
      return database.select().from(adminRoles).where(eq(adminRoles.userId, userId)).limit(1).then(([row]) => row);
    },

    // No self-service UI grants this in TASK-059 (Out of Scope: admin configuration page) — the
    // first admin is provisioned directly against this table; this method exists for that
    // bootstrap path and for a future admin-management task to call.
    grantRole(input: { userId: string; role: "SUPPORT" | "ADMIN" | "SUPER_ADMIN"; grantedBy: string | null }) {
      return database.insert(adminRoles).values(input)
        .onConflictDoUpdate({ target: adminRoles.userId, set: { role: input.role, grantedBy: input.grantedBy, updatedAt: new Date() } })
        .returning()
        .then(([row]) => row);
    },

    revokeRole(userId: string) {
      return database.delete(adminRoles).where(eq(adminRoles.userId, userId)).returning().then(([row]) => row);
    },
  };
}
