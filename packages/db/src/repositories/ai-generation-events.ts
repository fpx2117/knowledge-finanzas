import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import type { Database } from "../client";
import { aiGenerationEvents, users } from "../schema";

export type AIGenerationEventInput = {
  userId: string;
  capability: string;
  modelRole: string;
  resolvedModel: string | null;
  provider: string;
  generationId: string | null;
  operationId: string | null;
  status: "SUCCESS" | "FAILED";
  errorCode: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  costUsd: number | null;
  creditsCharged: number | null;
  latencyMs: number;
};

export type DateRange = { from: Date; to: Date };

export type SpendTotals = {
  calls: number;
  costUsd: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
};

const SUM_COLUMNS = {
  calls: sql<number>`count(*)::int`,
  costUsd: sql<string>`coalesce(sum(${aiGenerationEvents.costUsd}), 0)::text`,
  inputTokens: sql<number>`coalesce(sum(${aiGenerationEvents.inputTokens}), 0)::int`,
  outputTokens: sql<number>`coalesce(sum(${aiGenerationEvents.outputTokens}), 0)::int`,
  creditsCharged: sql<number>`coalesce(sum(${aiGenerationEvents.creditsCharged}), 0)::int`,
};

export function createAIGenerationEventRepository(database: Database) {
  function rangeWhere(range: DateRange) {
    return and(gte(aiGenerationEvents.createdAt, range.from), lt(aiGenerationEvents.createdAt, range.to));
  }

  return {
    async record(input: AIGenerationEventInput): Promise<void> {
      await database.insert(aiGenerationEvents).values({
        ...input,
        costUsd: input.costUsd === null ? null : input.costUsd.toString(),
      });
    },

    async sumForUser(userId: string, range: DateRange): Promise<SpendTotals> {
      const [row] = await database
        .select(SUM_COLUMNS)
        .from(aiGenerationEvents)
        .where(and(eq(aiGenerationEvents.userId, userId), rangeWhere(range)));
      return row ?? { calls: 0, costUsd: "0", inputTokens: 0, outputTokens: 0, creditsCharged: 0 };
    },

    async sumTotal(range: DateRange): Promise<SpendTotals> {
      const [row] = await database.select(SUM_COLUMNS).from(aiGenerationEvents).where(rangeWhere(range));
      return row ?? { calls: 0, costUsd: "0", inputTokens: 0, outputTokens: 0, creditsCharged: 0 };
    },

    sumByCapability(range: DateRange) {
      return database
        .select({ capability: aiGenerationEvents.capability, ...SUM_COLUMNS })
        .from(aiGenerationEvents)
        .where(rangeWhere(range))
        .groupBy(aiGenerationEvents.capability)
        .orderBy(desc(sql`sum(${aiGenerationEvents.costUsd})`));
    },

    sumByModel(range: DateRange) {
      return database
        .select({ resolvedModel: aiGenerationEvents.resolvedModel, ...SUM_COLUMNS })
        .from(aiGenerationEvents)
        .where(rangeWhere(range))
        .groupBy(aiGenerationEvents.resolvedModel)
        .orderBy(desc(sql`sum(${aiGenerationEvents.costUsd})`));
    },

    sumByUser(range: DateRange) {
      return database
        .select({ userId: aiGenerationEvents.userId, email: users.email, ...SUM_COLUMNS })
        .from(aiGenerationEvents)
        .innerJoin(users, eq(users.id, aiGenerationEvents.userId))
        .where(rangeWhere(range))
        .groupBy(aiGenerationEvents.userId, users.email)
        .orderBy(desc(sql`sum(${aiGenerationEvents.costUsd})`));
    },

    listForUser(userId: string, limit: number) {
      return database
        .select()
        .from(aiGenerationEvents)
        .where(eq(aiGenerationEvents.userId, userId))
        .orderBy(desc(aiGenerationEvents.createdAt))
        .limit(limit);
    },
  };
}

export type AIGenerationEventRepository = ReturnType<typeof createAIGenerationEventRepository>;
