import { afterAll, beforeAll, beforeEach } from "vitest";
import {
  cleanTestDatabase,
  closeTestDatabase,
  createTestDatabase,
  type TestDatabase,
} from "./test-database";

let database: TestDatabase;

beforeAll(() => {
  database = createTestDatabase();
});

beforeEach(async () => {
  await cleanTestDatabase(database);
});

afterAll(async () => {
  if (database) {
    await closeTestDatabase(database);
  }
});

export function getTestDatabase() {
  if (!database) {
    throw new Error("Test database has not been initialized");
  }

  return database;
}
