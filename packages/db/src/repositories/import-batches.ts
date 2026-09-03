import { desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { importBatches } from "../schema";

export function createImportBatchRepository(database: Database) {
  return {
    create(input: {
      userId: string;
      accountId: string;
      source?: string;
      filename?: string | null;
      rowCount: number;
      importedCount: number;
      skippedCount: number;
      failedCount: number;
    }) {
      return database
        .insert(importBatches)
        .values({
          userId: input.userId,
          accountId: input.accountId,
          source: input.source ?? "csv",
          filename: input.filename ?? null,
          rowCount: input.rowCount,
          importedCount: input.importedCount,
          skippedCount: input.skippedCount,
          failedCount: input.failedCount,
        })
        .returning()
        .then(([row]) => row);
    },

    listForUser(userId: string, limit = 20) {
      return database
        .select()
        .from(importBatches)
        .where(eq(importBatches.userId, userId))
        .orderBy(desc(importBatches.createdAt))
        .limit(limit);
    },
  };
}
