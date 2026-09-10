import { ApplicationError } from "@know-finanzas/shared";

import { detectSubscriptions, priceChangeImpact, type PriceTier } from "../lib/detect-subscriptions";
import type { RecurringTxn } from "../lib/detect-recurring";

const LOOKBACK_DAYS = 800;

type ExpenseRow = {
  merchantId: string | null;
  merchant: string | null;
  description: string;
  amount: string;
  currencyCode: string;
  occurredAt: Date;
  categoryId: string | null;
};

type SubscriptionRow = {
  id: string;
  merchantId: string;
  label: string;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  currencyCode: string;
  currentAmount: string;
  priceHistory: PriceTier[];
  categoryId: string | null;
  firstChargedOn: string;
  lastChargedOn: string;
  nextExpectedOn: string;
  chargeCount: number;
  confidence: string;
  status: "ACTIVE" | "INACTIVE" | "DISMISSED";
};

type SubscriptionUpsert = {
  userId: string;
  merchantId: string;
  label: string;
  frequency: SubscriptionRow["frequency"];
  currencyCode: string;
  currentAmount: string;
  priceHistory: PriceTier[];
  categoryId: string | null;
  firstChargedOn: string;
  lastChargedOn: string;
  nextExpectedOn: string;
  chargeCount: number;
  confidence: number;
};

type Dependencies = {
  transactions: { listExpensesSinceForUser(userId: string, since: Date): Promise<ExpenseRow[]> };
  subscriptions: {
    listForUser(userId: string, status?: SubscriptionRow["status"] | SubscriptionRow["status"][]): Promise<SubscriptionRow[]>;
    upsert(input: SubscriptionUpsert): Promise<unknown>;
    deactivateMissing(userId: string, keepMerchantIds: string[]): Promise<unknown>;
    setStatusForUser(subscriptionId: string, userId: string, status: SubscriptionRow["status"]): Promise<SubscriptionRow | undefined>;
    dismissedMerchantIds(userId: string): Promise<string[]>;
  };
  categories: { listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<Array<{ id: string; name: string }>> };
  /** Optional — merchants whose category makes them known-recurring (detected from 2 charges). */
  merchants?: { subscriptionLikeMerchantIds(): Promise<string[]> };
  now?: () => Date;
};

export type SubscriptionView = {
  id: string;
  merchantId: string;
  label: string;
  frequency: "MONTHLY" | "YEARLY" | SubscriptionRow["frequency"];
  currencyCode: string;
  currentAmount: string;
  categoryName: string | null;
  nextExpectedOn: string;
  lastChargedOn: string;
  chargeCount: number;
  status: SubscriptionRow["status"];
  priceChange: { from: string; to: string; monthlyImpact: number; yearlyImpact: number } | null;
};

function toView(row: SubscriptionRow, categoryName: string | null): SubscriptionView {
  const history = Array.isArray(row.priceHistory) ? row.priceHistory : [];
  const priceChange =
    history.length > 1 && (row.frequency === "MONTHLY" || row.frequency === "YEARLY")
      ? (() => {
          const from = history[history.length - 2].amount;
          const to = history[history.length - 1].amount;
          const impact = priceChangeImpact(row.frequency, Number(to) - Number(from));
          return { from, to, monthlyImpact: impact.monthly, yearlyImpact: impact.yearly };
        })()
      : null;
  return {
    id: row.id,
    merchantId: row.merchantId,
    label: row.label,
    frequency: row.frequency,
    currencyCode: row.currencyCode,
    currentAmount: row.currentAmount,
    categoryName,
    nextExpectedOn: row.nextExpectedOn,
    lastChargedOn: row.lastChargedOn,
    chargeCount: row.chargeCount,
    status: row.status,
    priceChange,
  };
}

export function createSubscriptionDetectionService({ transactions, subscriptions, categories, merchants, now = () => new Date() }: Dependencies) {
  return {
    async refreshForUser(userId: string): Promise<{ found: number }> {
      const since = new Date(now().getTime() - LOOKBACK_DAYS * 86_400_000);
      const [rows, dismissed, subscriptionLike] = await Promise.all([
        transactions.listExpensesSinceForUser(userId, since),
        subscriptions.dismissedMerchantIds(userId),
        merchants?.subscriptionLikeMerchantIds() ?? Promise.resolve([]),
      ]);
      const dismissedSet = new Set(dismissed);

      const txns: RecurringTxn[] = rows.map((r) => ({
        merchantId: r.merchantId,
        merchant: r.merchant,
        description: r.description,
        amount: r.amount,
        currencyCode: r.currencyCode,
        occurredOn: r.occurredAt.toISOString().slice(0, 10),
        categoryId: r.categoryId,
      }));

      const candidates = detectSubscriptions(txns, {
        now: now().toISOString().slice(0, 10),
        lowThresholdMerchantIds: new Set(subscriptionLike),
      }).filter((c) => !dismissedSet.has(c.merchantId));

      for (const c of candidates) {
        await subscriptions.upsert({
          userId,
          merchantId: c.merchantId,
          label: c.label,
          frequency: c.frequency,
          currencyCode: c.currencyCode,
          currentAmount: c.currentAmount,
          priceHistory: c.priceHistory,
          categoryId: c.categoryId,
          firstChargedOn: c.firstChargedOn,
          lastChargedOn: c.lastChargedOn,
          nextExpectedOn: c.nextExpectedOn,
          chargeCount: c.chargeCount,
          confidence: c.confidence,
        });
      }
      await subscriptions.deactivateMissing(userId, candidates.map((c) => c.merchantId));

      return { found: candidates.length };
    },

    async listSubscriptions(userId: string): Promise<SubscriptionView[]> {
      const [rows, cats] = await Promise.all([
        subscriptions.listForUser(userId, ["ACTIVE", "INACTIVE"]),
        categories.listForUser(userId, { includeArchived: true }),
      ]);
      const nameById = new Map(cats.map((c) => [c.id, c.name]));
      return rows.map((r) => toView(r, r.categoryId ? nameById.get(r.categoryId) ?? null : null));
    },

    async dismissSubscription(userId: string, subscriptionId: string) {
      const updated = await subscriptions.setStatusForUser(subscriptionId, userId, "DISMISSED");
      if (!updated) throw new ApplicationError("RECURRING_SERIES_NOT_FOUND");
      return updated;
    },
  };
}
