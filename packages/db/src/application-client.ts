import { env } from "@know-finanzas/config";
import { createDatabaseClient } from "./client";

const applicationClient = createDatabaseClient(env.DATABASE_URL);

export const db = applicationClient.db;

export async function checkDatabaseConnection(): Promise<void> {
  await applicationClient.client`select 1`;
}
