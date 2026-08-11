import { ApplicationError } from "@know-finanzas/shared";

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminUserSearchResult = { id: string; name: string; email: string; createdAt: Date };

export type SearchAdminUsersRepository = {
  findById(userId: string): Promise<AdminUserSearchResult | undefined>;
  searchByEmailPrefix(prefix: string, limit: number): Promise<AdminUserSearchResult[]>;
};

// Exact/prefix email or a known internal (UUID) id only — Security Requirement: "does not
// support unrestricted broad queries/export by default."
export function createSearchAdminUsers(dependencies: { users: SearchAdminUsersRepository }) {
  return async function searchAdminUsers(rawQuery: string): Promise<AdminUserSearchResult[]> {
    const query = rawQuery.trim();
    if (query.length < MIN_QUERY_LENGTH) throw new ApplicationError("ADMIN_SEARCH_QUERY_TOO_BROAD");

    if (UUID_PATTERN.test(query)) {
      const user = await dependencies.users.findById(query);
      return user ? [user] : [];
    }

    return dependencies.users.searchByEmailPrefix(query, MAX_RESULTS);
  };
}
