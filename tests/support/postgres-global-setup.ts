import {
  assertTestDatabaseAvailable,
  closeTestDatabase,
  createTestDatabase,
  migrateTestDatabase,
} from "./test-database";

export default async function globalSetup() {
  const database = createTestDatabase();

  try {
    await assertTestDatabaseAvailable(database);
    await migrateTestDatabase(database);
  } catch (error) {
    await closeTestDatabase(database);
    throw new Error(
      `PostgreSQL integration setup failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  return async () => closeTestDatabase(database);
}
