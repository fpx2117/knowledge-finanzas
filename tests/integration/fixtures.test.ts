import { describe, expect, it } from "vitest";
import { createTwoUserFixture, findAccountForUser } from "../support/fixtures";
import { getIsolatedTestDatabaseUrl } from "../support/test-database";

describe("isolated test fixtures", () => {
  it("does not return another user's account", () => {
    const { accounts, users } = createTwoUserFixture();

    expect(findAccountForUser(accounts, "account-b", users[0].id)).toBeUndefined();
    expect(findAccountForUser(accounts, "account-a", users[0].id)).toEqual(
      accounts[0],
    );
  });

  it("rejects production database URLs", () => {
    expect(() =>
      getIsolatedTestDatabaseUrl({
        TEST_DATABASE_URL: "postgresql://finance@production.example/finance",
      }),
    ).toThrow("must not point to a production database");
  });

  it("allows an explicitly isolated database URL", () => {
    expect(
      getIsolatedTestDatabaseUrl({
        TEST_DATABASE_URL: "postgresql://finance@localhost/know_finanzas_test",
      }),
    ).toBe("postgresql://finance@localhost/know_finanzas_test");
  });
});
