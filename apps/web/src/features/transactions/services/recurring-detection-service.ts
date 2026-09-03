import { ApplicationError } from "@know-finanzas/shared";

import { detectRecurringSeries, type RecurringTxn } from "../lib/detect-recurring";

const LOOKBACK_DAYS = 400;

type ExpenseRow = {
  merchantId: string | null;
  merchant: string | null;
  description: string;
  amount: string;
  currencyCode: string;
  occurredAt: Date;
  categoryId: string | null;
};

type SeriesRow = {
  id: string;
  merchantId: string | null;
  label: string;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  typicalAmount: string;
  currencyCode: string;
  categoryId: string | null;
  occurrenceCount: number;
  confidence: string;
  lastSeenOn: string;
  nextExpectedOn: string;
  status: "SUGGESTED" | "CONFIRMED" | "DISMISSED";
};

type SeriesUpsertInput = {
  userId: string;
  merchantId: string | null;
  groupKey: string;
  label: string;
  frequency: SeriesRow["frequency"];
  typicalAmount: string;
  currencyCode: string;
  categoryId: string | null;
  occurrenceCount: number;
  confidence: number;
  lastSeenOn: string;
  nextExpectedOn: string;
};

type Dependencies = {
  transactions: { listExpensesSinceForUser(userId: string, since: Date): Promise<ExpenseRow[]> };
  recurringSeries: {
    listForUser(userId: string, status?: "SUGGESTED" | "CONFIRMED" | "DISMISSED"): Promise<SeriesRow[]>;
    upsertSuggested(input: SeriesUpsertInput): Promise<unknown>;
    pruneSuggested(userId: string, keepGroupKeys: string[]): Promise<unknown>;
    setStatusForUser(seriesId: string, userId: string, status: "SUGGESTED" | "CONFIRMED" | "DISMISSED"): Promise<SeriesRow | undefined>;
    dismissedGroupKeys(userId: string): Promise<string[]>;
  };
  categories: { listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<Array<{ id: string; name: string }>> };
  now?: () => Date;
};

export type RecurringSuggestionView = {
  id: string;
  label: string;
  frequency: SeriesRow["frequency"];
  typicalAmount: string;
  currencyCode: string;
  categoryName: string | null;
  occurrenceCount: number;
  confidence: number;
  lastSeenOn: string;
  nextExpectedOn: string;
};

export function createRecurringDetectionService({ transactions, recurringSeries, categories, now = () => new Date() }: Dependencies) {
  return {
    /** Re-scan the user's recent expenses and refresh their SUGGESTED series. */
    async refreshForUser(userId: string): Promise<{ found: number }> {
      const since = new Date(now().getTime() - LOOKBACK_DAYS * 86_400_000);
      const [rows, suppressed] = await Promise.all([
        transactions.listExpensesSinceForUser(userId, since),
        recurringSeries.dismissedGroupKeys(userId),
      ]);
      const suppressedSet = new Set(suppressed);

      const txns: RecurringTxn[] = rows.map((r) => ({
        merchantId: r.merchantId,
        merchant: r.merchant,
        description: r.description,
        amount: r.amount,
        currencyCode: r.currencyCode,
        occurredOn: r.occurredAt.toISOString().slice(0, 10),
        categoryId: r.categoryId,
      }));

      const candidates = detectRecurringSeries(txns, { now: now().toISOString().slice(0, 10) })
        .filter((c) => !suppressedSet.has(c.groupKey));

      for (const c of candidates) {
        await recurringSeries.upsertSuggested({
          userId,
          merchantId: c.merchantId,
          groupKey: c.groupKey,
          label: c.label,
          frequency: c.frequency,
          typicalAmount: c.typicalAmount,
          currencyCode: c.currencyCode,
          categoryId: c.categoryId,
          occurrenceCount: c.occurrenceCount,
          confidence: c.confidence,
          lastSeenOn: c.lastSeenOn,
          nextExpectedOn: c.nextExpectedOn,
        });
      }
      await recurringSeries.pruneSuggested(userId, candidates.map((c) => c.groupKey));

      return { found: candidates.length };
    },

    async listSuggestions(userId: string): Promise<RecurringSuggestionView[]> {
      const [series, cats] = await Promise.all([
        recurringSeries.listForUser(userId, "SUGGESTED"),
        categories.listForUser(userId, { includeArchived: true }),
      ]);
      const nameById = new Map(cats.map((c) => [c.id, c.name]));
      return series.map((s) => ({
        id: s.id,
        label: s.label,
        frequency: s.frequency,
        typicalAmount: s.typicalAmount,
        currencyCode: s.currencyCode,
        categoryName: s.categoryId ? nameById.get(s.categoryId) ?? null : null,
        occurrenceCount: s.occurrenceCount,
        confidence: Number(s.confidence),
        lastSeenOn: s.lastSeenOn,
        nextExpectedOn: s.nextExpectedOn,
      }));
    },

    async confirmSuggestion(userId: string, seriesId: string) {
      const updated = await recurringSeries.setStatusForUser(seriesId, userId, "CONFIRMED");
      if (!updated) throw new ApplicationError("RECURRING_SERIES_NOT_FOUND");
      return updated;
    },

    async dismissSuggestion(userId: string, seriesId: string) {
      const updated = await recurringSeries.setStatusForUser(seriesId, userId, "DISMISSED");
      if (!updated) throw new ApplicationError("RECURRING_SERIES_NOT_FOUND");
      return updated;
    },
  };
}
