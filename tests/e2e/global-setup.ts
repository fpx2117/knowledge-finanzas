import {
  assertTestDatabaseAvailable,
  cleanTestDatabase,
  closeTestDatabase,
  createTestDatabase,
  migrateTestDatabase,
} from "../support/test-database";

export default async function globalSetup() {
  const database = createTestDatabase();
  try {
    await assertTestDatabaseAvailable(database);
    await migrateTestDatabase(database);
    await cleanTestDatabase(database);
  } finally {
    await closeTestDatabase(database);
  }
}
