import { createBillingSubscriptionRepository, createUserRepository, db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";

import { getAIUsageSummary } from "@/lib/billing/ai-usage-summary.instance";
import { productAccessGate } from "@/lib/billing/product-access-gate.instance";

const users = createUserRepository(db);
const subscriptions = createBillingSubscriptionRepository(db);

export type AssistantAccess =
  | { enabled: false; reason: "DISABLED" | "ACCESS_REQUIRED" }
  | { enabled: true; credits: { available: number; total: number; kind: "FREE" | "TRIAL" | "PRO" } };

/** What the floating assistant needs to decide whether to offer itself and show a credit meter. */
export async function getAssistantAccess(userId: string): Promise<AssistantAccess> {
  if (!env.AI_ENABLED) return { enabled: false, reason: "DISABLED" };

  const access = await productAccessGate.getAccessState(userId);
  if (access === "EXPIRED_READ_ONLY" || access === "NO_ACCESS") {
    return { enabled: false, reason: "ACCESS_REQUIRED" };
  }

  const [user, subscription] = await Promise.all([
    users.findAccessInputById(userId),
    subscriptions.findEffectiveForUser(userId),
  ]);

  const summary = await getAIUsageSummary({
    userId,
    access,
    trialEndsAt: user?.trialEndsAt ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  });

  if (summary.state === "ACCESS_REQUIRED") return { enabled: false, reason: "ACCESS_REQUIRED" };
  return {
    enabled: true,
    credits: {
      available: summary.available,
      total: summary.total,
      kind: summary.state === "TRIAL" ? "TRIAL" : summary.state === "FREE" ? "FREE" : "PRO",
    },
  };
}
