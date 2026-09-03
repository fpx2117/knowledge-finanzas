import { describe, expect, it, vi } from "vitest";
import { createSearchAdminUsers } from "../../apps/web/src/features/admin/users/services/search-admin-users";

const userA = { id: "0a3f4c9e-1b2d-4e5f-8a6b-7c8d9e0f1a2b", name: "User A", email: "a@example.test", createdAt: new Date() };

function fakeUsers(byId: typeof userA | undefined = undefined, byPrefix: (typeof userA)[] = []) {
  return {
    findById: vi.fn(async () => byId),
    searchByEmailPrefix: vi.fn(async () => byPrefix),
  };
}

describe("createSearchAdminUsers", () => {
  it("rejects a query shorter than 3 characters", async () => {
    const search = createSearchAdminUsers({ users: fakeUsers() });
    await expect(search("ab")).rejects.toThrow("ADMIN_SEARCH_QUERY_TOO_BROAD");
  });

  it("rejects an empty/whitespace-only query", async () => {
    const search = createSearchAdminUsers({ users: fakeUsers() });
    await expect(search("   ")).rejects.toThrow("ADMIN_SEARCH_QUERY_TOO_BROAD");
  });

  it("routes a UUID-shaped query to an exact id lookup, not a prefix scan", async () => {
    const users = fakeUsers(userA);
    const search = createSearchAdminUsers({ users });

    const result = await search(userA.id);

    expect(users.findById).toHaveBeenCalledWith(userA.id);
    expect(users.searchByEmailPrefix).not.toHaveBeenCalled();
    expect(result).toEqual([userA]);
  });

  it("returns an empty array for an unknown id", async () => {
    const users = fakeUsers(undefined);
    const search = createSearchAdminUsers({ users });

    const result = await search("00000000-0000-0000-0000-000000000000");

    expect(result).toEqual([]);
  });

  it("routes a non-UUID query to an email-prefix search", async () => {
    const users = fakeUsers(undefined, [userA]);
    const search = createSearchAdminUsers({ users });

    const result = await search("a@exam");

    expect(users.searchByEmailPrefix).toHaveBeenCalledWith("a@exam", 20);
    expect(users.findById).not.toHaveBeenCalled();
    expect(result).toEqual([userA]);
  });
});
