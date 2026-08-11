export type TestUser = {
  id: string;
  email: string;
};

export type TestAccount = {
  id: string;
  userId: string;
};

export function createTwoUserFixture() {
  const users: [TestUser, TestUser] = [
    { id: "user-a", email: "a@example.test" },
    { id: "user-b", email: "b@example.test" },
  ];

  const accounts: [TestAccount, TestAccount] = [
    { id: "account-a", userId: users[0].id },
    { id: "account-b", userId: users[1].id },
  ];

  return { users, accounts };
}

export function findAccountForUser(
  accounts: readonly TestAccount[],
  accountId: string,
  userId: string,
) {
  return accounts.find(
    (account) => account.id === accountId && account.userId === userId,
  );
}
