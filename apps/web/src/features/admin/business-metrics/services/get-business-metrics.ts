import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import type { Database } from "@know-finanzas/db";
import { aiCreditEntries, billingSubscriptions, notificationDeliveries, users } from "@know-finanzas/db/schema";
import { buildUnitEconomicsSnapshot, evaluateCostGuardrails, type GuardrailBreach, type UnitEconomicsSnapshot } from "@know-finanzas/observability";
import type { PricingConfig } from "@know-finanzas/config";
import { requirePermission, type AdminRole } from "@know-finanzas/shared";

// TASK-046's "business metric aggregation/query contract" — the one place real usage/subscriber
// counts are pulled from the database and fed into the pure calculators in
// @know-finanzas/observability. Admin-only (Security Requirement) — every call requires an actor
// with commercial.metrics.read, checked server-side the same way every other admin service in
// this codebase checks permissions (never trusting a client-declared role).
//
// Every dimension queried here is a count/sum, never a raw transaction description, AI prompt, or
// per-user financial history (Security Requirement: "metric dimensions are minimized... business
// metrics are admin-only and do not expose user financial history or raw AI prompts").
export async function getBusinessMetrics(database: Database, actor: { role: AdminRole | null }, config: PricingConfig): Promise<{ snapshot: UnitEconomicsSnapshot; guardrailBreaches: GuardrailBreach[] }> {
  requirePermission(actor.role, "commercial.metrics.read");

  const now = new Date();

  const [proSubscriberRow] = await database
    .select({ count: sql<number>`count(*)` })
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.status, "ACTIVE"));
  const proSubscriberCount = Number(proSubscriberRow?.count ?? 0);

  const [aiConsumedRow] = await database
    .select({ total: sql<number>`coalesce(sum(${aiCreditEntries.amount}), 0)` })
    .from(aiCreditEntries)
    .where(eq(aiCreditEntries.type, "CONSUMPTION"));
  const aiCreditsConsumed = Number(aiConsumedRow?.total ?? 0);

  const [whatsappSentRow] = await database
    .select({ count: sql<number>`count(*)` })
    .from(notificationDeliveries)
    .where(and(eq(notificationDeliveries.channel, "WHATSAPP"), sql`${notificationDeliveries.status} in ('SENT', 'DELIVERED')`));
  const whatsappMessagesSent = Number(whatsappSentRow?.count ?? 0);

  const [trialStartRow] = await database
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(isNotNull(users.trialStartedAt));
  const trialStartCount = Number(trialStartRow?.count ?? 0);

  // "Converted" here means: started a trial and now has an ACTIVE paid subscription — an
  // approximation for business-review purposes (this is a metrics service, not the billing
  // ledger's own access resolution), not a claim of exact real-time product access state.
  const [convertedRow] = await database
    .select({ count: sql<number>`count(distinct ${users.id})` })
    .from(users)
    .innerJoin(billingSubscriptions, and(eq(billingSubscriptions.userId, users.id), eq(billingSubscriptions.status, "ACTIVE")))
    .where(isNotNull(users.trialStartedAt));
  const trialToProConversionCount = Number(convertedRow?.count ?? 0);

  const [expiredTrialRow] = await database
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .leftJoin(billingSubscriptions, and(eq(billingSubscriptions.userId, users.id), eq(billingSubscriptions.status, "ACTIVE")))
    .where(and(isNotNull(users.trialStartedAt), lt(users.trialEndsAt, now), sql`${billingSubscriptions.id} is null`));
  const expiredTrialUserCount = Number(expiredTrialRow?.count ?? 0);

  // Usage consumed specifically during an active trial window — TRIAL_ALLOWANCE pool only.
  const [trialAiConsumedRow] = await database
    .select({ total: sql<number>`coalesce(sum(${aiCreditEntries.amount}), 0)` })
    .from(aiCreditEntries)
    .where(and(eq(aiCreditEntries.type, "CONSUMPTION"), eq(aiCreditEntries.pool, "TRIAL_ALLOWANCE")));
  const trialAiCreditsConsumed = Number(trialAiConsumedRow?.total ?? 0);

  const snapshot = buildUnitEconomicsSnapshot(config, {
    revenue: { proMonthlyPrice: config.proMonthlyPrice, proSubscriberCount },
    usage: { aiCreditsConsumed, whatsappMessagesSent },
    trial: {
      trialStartCount,
      trialToProConversionCount,
      retainedProUserCount: trialToProConversionCount,
      expiredTrialUserCount,
      trialAiCreditsConsumed,
      // Not separately tracked per-pool for WhatsApp deliveries (no pool concept exists for
      // WhatsApp allowance) — approximated as 0 here; total WhatsApp cost is still fully captured
      // in the top-level usage figure above.
      trialWhatsappMessagesSent: 0,
    },
  });

  const guardrailBreaches = evaluateCostGuardrails(config, snapshot);

  return { snapshot, guardrailBreaches };
}
