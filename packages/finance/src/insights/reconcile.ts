import type { InsightCandidate, InsightFamily, InsightStatus } from "./types";

/** Per-family cooldown after a user dismisses an insight (spec 09 §8, §16). */
export const DISMISS_COOLDOWN_DAYS: Record<InsightFamily, number> = {
  "INS-SPEND-DELTA": 21,
  "INS-SPEND-PACE": 14,
  "INS-BUDGET-LIMIT": 10,
  "INS-CASH-RISK": 7,
  "INS-OBL-DUE": 7,
  "INS-REC-AMOUNT": 30,
  "INS-REC-DETECT": 30,
  "INS-ANOMALY-AMOUNT": 30,
  "INS-GOAL-PACE": 14,
  "INS-DATA-QUALITY": 7,
};

export type StoredInsight = {
  id: string;
  family: InsightFamily;
  dedupeKey: string;
  status: InsightStatus;
  body: string;
  dismissedAt: string | null;
};

export type ReconcileAction =
  | { kind: "insert"; candidate: InsightCandidate }
  | { kind: "update"; id: string; candidate: InsightCandidate; reactivate: boolean }
  | { kind: "resolve"; id: string }
  | { kind: "skip"; dedupeKey: string; reason: string };

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000);
}

const OPEN_STATUSES = new Set<InsightStatus>(["DETECTED", "ACTIVE", "SEEN"]);

/**
 * spec 09 §8/§17/§18 — pure reconciliation of a fresh detector pass against what's stored:
 *  - a candidate with no stored row → insert (DETECTED→ACTIVE once it clears sufficiency).
 *  - a candidate matching an OPEN stored row → update copy only if it changed (supersede in
 *    place, never duplicate §18); status is untouched.
 *  - a candidate matching a DISMISSED row still inside its cooldown → skip.
 *  - a candidate matching a DISMISSED row past cooldown → update + reactivate.
 *  - an OPEN stored row with no matching candidate → resolve (the condition is gone).
 * Terminal rows (RESOLVED/EXPIRED/SUPERSEDED/INVALIDATED) are left alone.
 */
export function reconcileInsights(
  candidates: readonly InsightCandidate[],
  stored: readonly StoredInsight[],
  nowISO: string,
): ReconcileAction[] {
  const candidateByKey = new Map(candidates.map((c) => [c.dedupeKey, c]));
  const storedByKey = new Map(stored.map((s) => [s.dedupeKey, s]));
  const actions: ReconcileAction[] = [];

  for (const candidate of candidates) {
    if (candidate.sufficiency === "INSUFFICIENT") {
      actions.push({ kind: "skip", dedupeKey: candidate.dedupeKey, reason: "insufficient evidence" });
      continue;
    }
    const existing = storedByKey.get(candidate.dedupeKey);
    if (!existing) {
      actions.push({ kind: "insert", candidate });
      continue;
    }
    if (existing.status === "DISMISSED") {
      const cooldown = DISMISS_COOLDOWN_DAYS[candidate.family];
      if (existing.dismissedAt && daysBetween(existing.dismissedAt, nowISO) < cooldown) {
        actions.push({ kind: "skip", dedupeKey: candidate.dedupeKey, reason: "within dismiss cooldown" });
      } else {
        actions.push({ kind: "update", id: existing.id, candidate, reactivate: true });
      }
      continue;
    }
    if (OPEN_STATUSES.has(existing.status)) {
      if (existing.body !== candidate.body) {
        actions.push({ kind: "update", id: existing.id, candidate, reactivate: false });
      } else {
        actions.push({ kind: "skip", dedupeKey: candidate.dedupeKey, reason: "unchanged" });
      }
      continue;
    }
    // terminal — leave alone
    actions.push({ kind: "skip", dedupeKey: candidate.dedupeKey, reason: `terminal (${existing.status})` });
  }

  for (const row of stored) {
    if (OPEN_STATUSES.has(row.status) && !candidateByKey.has(row.dedupeKey)) {
      actions.push({ kind: "resolve", id: row.id });
    }
  }

  return actions;
}
