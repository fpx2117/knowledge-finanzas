import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDatabaseClient(url: string) {
  const client = postgres(url, {
    prepare: false,
    // Bound the pool. `next dev` re-evaluates this module on every hot reload and never closes the
    // previous pool; a large `max` there quickly exhausts Postgres `max_connections` (100) →
    // "demasiados clientes". `idle_timeout` also lets idle backends drop on their own.
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

export type Database = ReturnType<typeof createDatabaseClient>["db"];
