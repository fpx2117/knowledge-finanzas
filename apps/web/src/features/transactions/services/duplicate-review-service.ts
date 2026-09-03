import { ApplicationError } from "@know-finanzas/shared";

import { DUPLICATE_REVIEW_THRESHOLD, duplicateScore, type FingerprintInput } from "../lib/transaction-fingerprint";

const LOOKBACK_DAYS = 180;

type ScanRow = {
  id: string;
  type: string;
  accountId: string;
  description: string;
  merchant: string | null;
  merchantId: string | null;
  amount: string;
  currencyCode: string;
  occurredAt: Date;
  paymentMethod: string | null;
};

type Dependencies = {
  transactions: {
    listPostedForDuplicateScan(userId: string, since: Date): Promise<ScanRow[]>;
    findByIdForUser(id: string, userId: string): Promise<{ id: string; status: "POSTED" | "VOIDED" } | undefined>;
    voidForUser(id: string, userId: string, at: Date): Promise<unknown>;
  };
  dismissals: {
    listKeysForUser(userId: string): Promise<string[]>;
    dismiss(userId: string, a: string, b: string): Promise<unknown>;
  };
  now?: () => Date;
};

export type DuplicatePairView = {
  score: number;
  a: { id: string; description: string; occurredOn: string; amount: string; type: string };
  b: { id: string; description: string; occurredOn: string; amount: string; type: string };
};

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function toFingerprint(r: ScanRow): FingerprintInput {
  return {
    merchantId: r.merchantId,
    merchant: r.merchant,
    amount: r.amount,
    currencyCode: r.currencyCode,
    occurredOn: r.occurredAt.toISOString().slice(0, 10),
    accountId: r.accountId,
    paymentMethod: r.paymentMethod,
  };
}

export function createDuplicateReviewService({ transactions, dismissals, now = () => new Date() }: Dependencies) {
  return {
    async scanForUser(userId: string): Promise<DuplicatePairView[]> {
      const since = new Date(now().getTime() - LOOKBACK_DAYS * 86_400_000);
      const [rows, dismissedKeys] = await Promise.all([
        transactions.listPostedForDuplicateScan(userId, since),
        dismissals.listKeysForUser(userId),
      ]);
      const dismissed = new Set(dismissedKeys);

      // Duplicates must share account + currency + (near-)amount, so bucket by that first.
      const buckets = new Map<string, ScanRow[]>();
      for (const row of rows) {
        const key = `${row.accountId}|${row.currencyCode}|${row.type}|${Math.round(Number(row.amount) * 100)}`;
        const bucket = buckets.get(key);
        if (bucket) bucket.push(row);
        else buckets.set(key, [row]);
      }

      const pairs: DuplicatePairView[] = [];
      const seen = new Set<string>();
      for (const bucket of buckets.values()) {
        if (bucket.length < 2) continue;
        for (let i = 0; i < bucket.length; i++) {
          for (let j = i + 1; j < bucket.length; j++) {
            const key = pairKey(bucket[i].id, bucket[j].id);
            if (dismissed.has(key) || seen.has(key)) continue;
            const score = duplicateScore(toFingerprint(bucket[i]), toFingerprint(bucket[j]));
            if (score < DUPLICATE_REVIEW_THRESHOLD) continue;
            seen.add(key);
            const [a, b] = [bucket[i], bucket[j]].sort((x, y) => y.occurredAt.getTime() - x.occurredAt.getTime());
            pairs.push({
              score,
              a: { id: a.id, description: a.description, occurredOn: a.occurredAt.toISOString().slice(0, 10), amount: a.amount, type: a.type },
              b: { id: b.id, description: b.description, occurredOn: b.occurredAt.toISOString().slice(0, 10), amount: b.amount, type: b.type },
            });
          }
        }
      }
      return pairs.sort((x, y) => y.score - x.score);
    },

    async dismissPair(userId: string, transactionIdA: string, transactionIdB: string) {
      return dismissals.dismiss(userId, transactionIdA, transactionIdB);
    },

    /** Confirm the pair is a duplicate: void `voidId`, and remember the pair so it stays gone. */
    async resolvePair(userId: string, keepId: string, voidId: string) {
      const target = await transactions.findByIdForUser(voidId, userId);
      if (!target) throw new ApplicationError("TRANSACTION_NOT_FOUND");
      if (target.status === "POSTED") await transactions.voidForUser(voidId, userId, now());
      await dismissals.dismiss(userId, keepId, voidId).catch(() => undefined);
      return { ok: true };
    },
  };
}
