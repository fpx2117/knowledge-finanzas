import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { importBatches } from "../schema";
import { isUniqueViolation } from "../pg-errors";

export function createImportBatchRepository(database: Database) {
  /** The batch previously committed under this user's idempotency key, if any. */
  function findByCommandId(userId: string, commandId: string) {
    return database
      .select()
      .from(importBatches)
      .where(and(eq(importBatches.userId, userId), eq(importBatches.commandId, commandId)))
      .limit(1)
      .then(([row]) => row);
  }

  return {
    findByCommandId,

    async create(input: {
      userId: string;
      accountId: string;
      source?: string;
      filename?: string | null;
      rowCount: number;
      importedCount: number;
      skippedCount: number;
      failedCount: number;
      commandId?: string | null;
    }) {
      try {
        return await database
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
            commandId: input.commandId ?? null,
          })
          .returning()
          .then(([row]) => row);
      } catch (error) {
        // A concurrent commit with the same idempotency key already inserted the batch row —
        // return the winner instead of surfacing the conflict.
        if (input.commandId && isUniqueViolation(error, "import_batches_user_command_unique")) {
          const existing = await findByCommandId(input.userId, input.commandId);
          if (existing) return existing;
        }
        throw error;
      }
    },

    // Inserts a zero-count placeholder to claim an idempotency key *before* any row processing
    // happens (see import-service.ts) and reports, unambiguously, whether this call is the one
    // that claimed it — unlike `create`, whose return value alone can't distinguish "I won" from
    // "I lost to a concurrent claim that also happens to still show zero counts."
    async claim(input: { userId: string; accountId: string; filename: string | null; commandId: string }) {
      try {
        const row = await database
          .insert(importBatches)
          .values({ userId: input.userId, accountId: input.accountId, source: "csv", filename: input.filename, rowCount: 0, importedCount: 0, skippedCount: 0, failedCount: 0, commandId: input.commandId })
          .returning()
          .then(([r]) => r);
        return { batch: row, claimed: true as const };
      } catch (error) {
        if (isUniqueViolation(error, "import_batches_user_command_unique")) {
          const existing = await findByCommandId(input.userId, input.commandId);
          if (existing) return { batch: existing, claimed: false as const };
        }
        throw error;
      }
    },

    // Fills in the real counts on a batch that was inserted as a zero-count placeholder to
    // claim its idempotency key before row processing started (see import-service.ts).
    updateCounts(batchId: string, counts: { rowCount: number; importedCount: number; skippedCount: number; failedCount: number }) {
      return database.update(importBatches).set(counts).where(eq(importBatches.id, batchId)).returning().then(([row]) => row);
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
