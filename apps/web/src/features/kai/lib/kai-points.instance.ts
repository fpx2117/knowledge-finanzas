import { kaiInteractionRepository } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";
import { monthRangeForTimezone, todayInTimezone } from "@know-finanzas/finance";

import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

/**
 * KAI points — the single visible KAI meter (monetización). A deterministic answer costs 1
 * point, an LLM analysis 5. FREE has a monthly allowance; TRIAL and PRO are unlimited. This
 * is the upgrade lever: FREE sees the bar go down, PRO never does.
 *
 * KAI's deterministic answers are a core product feature (your own data), so a lapsed /
 * no-access user still gets the FREE allowance rather than being locked out entirely.
 */
export type KaiAccess = {
  unlimited: boolean;
  used: number;
  /** null when unlimited. */
  allowance: number | null;
  remaining: number | null;
  /** true when a FREE user has hit the monthly wall — the LLM path is blocked, deterministic still works via grace. */
  exhausted: boolean;
};

function currentMonthRange(now: Date, timezone: string) {
  const today = todayInTimezone(now, timezone);
  const [year, month] = today.split("-").map(Number);
  const range = monthRangeForTimezone(year, month, timezone);
  return { from: range.start, to: range.end };
}

export async function getKaiAccess(userId: string, timezone: string, now: Date = new Date()): Promise<KaiAccess> {
  const [access, used] = await Promise.all([
    productAccessGate.getAccessState(userId).catch(() => "FREE" as const),
    kaiInteractionRepository.consumedPointsForUser(userId, currentMonthRange(now, timezone)).catch(() => 0),
  ]);

  if (access === "TRIAL" || access === "PRO") {
    return { unlimited: true, used, allowance: null, remaining: null, exhausted: false };
  }

  const allowance = env.FREE_KAI_POINTS_PER_PERIOD;
  const remaining = Math.max(0, allowance - used);
  return { unlimited: false, used, allowance, remaining, exhausted: remaining <= 0 };
}
