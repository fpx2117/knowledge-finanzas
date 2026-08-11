import { createUserRepository, db } from "@know-finanzas/db";
import { createSearchAdminUsers } from "@/features/admin/users/services/search-admin-users";

export const searchAdminUsers = createSearchAdminUsers({ users: createUserRepository(db) });
