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
  /** Truncated user phrasing — only for UNRESOLVED / LLM rows (spec §25). */
  unresolvedText?: string | null;
  /** Why the pipeline reached for the LLM — spec §19 "reasonForLLM". Null for a local answer. */
  reasonForLlm?: string | null;
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
    /** Returns the new row's id — the client needs it to attach a 👍/👎 later. */
    async record(input: KaiInteractionInput): Promise<string> {
      const [row] = await database
        .insert(kaiInteractions)
        .values({
          ...input,
          aiCostUsd: input.aiCostUsd.toString(),
          unresolvedText: input.unresolvedText ?? null,
          reasonForLlm: input.reasonForLlm ?? null,
        })
        .returning({ id: kaiInteractions.id });
      return row.id;
    },

    /** Sets the feedback on one interaction — scoped to `userId` so a client-supplied id can
     * never rate someone else's row (spec 14 IDOR discipline). No-op (silently) if it doesn't
     * belong to this user or doesn't exist. */
    async setFeedback(id: string, userId: string, feedback: "up" | "down"): Promise<void> {
      await database
        .update(kaiInteractions)
        .set({ feedback })
        .where(and(eq(kaiInteractions.id, id), eq(kaiInteractions.userId, userId)));
    },

    /** Recent UNRESOLVED / LLM-fallback phrasings — the "intents faltantes" report (spec §25). */
    recentUnresolved(range: KaiDateRange, limit: number) {
      return database
        .select({ text: kaiInteractions.unresolvedText, createdAt: kaiInteractions.createdAt })
        .from(kaiInteractions)
        .where(and(rangeWhere(range), sql`${kaiInteractions.unresolvedText} is not null`))
        .orderBy(desc(kaiInteractions.createdAt))
        .limit(limit);
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

    /** Why the LLM was reached, when it was (spec §19 "reasonForLLM") — helps tell "the catalogue
     * is missing an intent" (unresolved) apart from "the resolver picked wrong" (low-confidence)
     * apart from "a handler broke" (handler-error). */
    countByReasonForLlm(range: KaiDateRange) {
      return database
        .select({ reason: kaiInteractions.reasonForLlm, count: sql<number>`count(*)::int` })
        .from(kaiInteractions)
        .where(and(rangeWhere(range), sql`${kaiInteractions.reasonForLlm} is not null`))
        .groupBy(kaiInteractions.reasonForLlm)
        .orderBy(desc(sql`count(*)`));
    },

    /** 👍/👎 tally by intent, rated interactions only — a downvoted deterministic answer means
     * the handler/template is wrong for that intent, not that the intent is missing. */
    countFeedbackByIntent(range: KaiDateRange) {
      return database
        .select({
          intentId: kaiInteractions.intentId,
          up: sql<number>`count(*) filter (where ${kaiInteractions.feedback} = 'up')::int`,
          down: sql<number>`count(*) filter (where ${kaiInteractions.feedback} = 'down')::int`,
        })
        .from(kaiInteractions)
        .where(and(rangeWhere(range), sql`${kaiInteractions.feedback} is not null`))
        .groupBy(kaiInteractions.intentId)
        .orderBy(desc(sql`count(*) filter (where ${kaiInteractions.feedback} = 'down')`));
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
