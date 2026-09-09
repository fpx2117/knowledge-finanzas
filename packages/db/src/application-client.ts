import { env } from "@know-finanzas/config";
import { createDatabaseClient } from "./client";

// `next dev` re-evaluates this module on every hot reload. Without caching, each reload builds a
// new postgres pool and leaks the old one — after a handful of edits Postgres hits
// `max_connections` and every page throws "demasiados clientes". Pin the client to `globalThis`
// in non-production so HMR reuses one pool for the life of the dev server.
const globalForDb = globalThis as unknown as { __kfDbClient?: ReturnType<typeof createDatabaseClient> };

const applicationClient =
  globalForDb.__kfDbClient ?? createDatabaseClient(env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__kfDbClient = applicationClient;
}

export const db = applicationClient.db;

export async function checkDatabaseConnection(): Promise<void> {
  await applicationClient.client`select 1`;
}
