import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

import type { Database } from "../client";
import { kaiInteractions } from "../schema";

export type KaiInteractionInput = {
  userId: string;
  intentId: string;
  resolutionSource: string;
  weight: number;
  llmUsed: boolean;
  aiCostUsd: number;
  latencyMs: number;
  responseType: string;
  screenContext: string | null;
};

export type KaiDateRange = { from: Date; to: Date };

export type KaiResolutionStats = {
  total: number;
  local: number;
  llm: number;
  /** local ÷ total, 0..1 — the KAI_LOCAL_RESOLUTION_RATE KPI (spec §25). */
  localResolutionRate: number;
};

export function createKaiInteractionRepository(database: Database) {
  function rangeWhere(range: KaiDateRange) {
    return and(gte(kaiInteractions.createdAt, range.from), lt(kaiInteractions.createdAt, range.to));
  }

  return {
    async record(input: KaiInteractionInput): Promise<void> {
      await database.insert(kaiInteractions).values({
        ...input,
        aiCostUsd: input.aiCostUsd.toString(),
      });
    },

    /** Total KAI points the user consumed in the range — drives the FREE monthly allowance. */
    async consumedPointsForUser(userId: string, range: KaiDateRange): Promise<number> {
      const [row] = await database
        .select({ points: sql<number>`coalesce(sum(${kaiInteractions.weight}), 0)::int` })
        .from(kaiInteractions)
        .where(and(eq(kaiInteractions.userId, userId), rangeWhere(range)));
      return row?.points ?? 0;
    },

    async resolutionStats(range: KaiDateRange): Promise<KaiResolutionStats> {
      const [row] = await database
        .select({
          total: sql<number>`count(*)::int`,
          llm: sql<number>`count(*) filter (where ${kaiInteractions.llmUsed})::int`,
        })
        .from(kaiInteractions)
        .where(rangeWhere(range));
      const total = row?.total ?? 0;
      const llm = row?.llm ?? 0;
      const local = total - llm;
      return { total, local, llm, localResolutionRate: total === 0 ? 1 : local / total };
    },

    countByIntent(range: KaiDateRange) {
      return database
        .select({
          intentId: kaiInteractions.intentId,
          resolutionSource: kaiInteractions.resolutionSource,
          count: sql<number>`count(*)::int`,
        })
        .from(kaiInteractions)
        .where(rangeWhere(range))
        .groupBy(kaiInteractions.intentId, kaiInteractions.resolutionSource)
        .orderBy(desc(sql`count(*)`));
    },

    listForUser(userId: string, limit: number) {
      return database
        .select()
        .from(kaiInteractions)
        .where(eq(kaiInteractions.userId, userId))
        .orderBy(desc(kaiInteractions.createdAt))
        .limit(limit);
    },
  };
}

export type KaiInteractionRepository = ReturnType<typeof createKaiInteractionRepository>;
