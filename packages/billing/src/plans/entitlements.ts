import type { EffectiveSubscriptionSnapshot, ProductAccessState } from "../domain/billing-types";
import { resolveProductAccess } from "./resolver";

export function hasEntitlement(state: ProductAccessState): boolean {
  return state !== "EXPIRED_READ_ONLY" && state !== "NO_ACCESS";
}

export function createEntitlementService(dependencies: { graceDays: number; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return {
    resolveAccess(input: { trialEndsAt: Date | null; subscription: EffectiveSubscriptionSnapshot | null }): ProductAccessState {
      return resolveProductAccess({ now: now(), trialEndsAt: input.trialEndsAt, subscription: input.subscription, graceDays: dependencies.graceDays });
    },

    hasEntitlement(input: { trialEndsAt: Date | null; subscription: EffectiveSubscriptionSnapshot | null }): boolean {
      const state = resolveProductAccess({ now: now(), trialEndsAt: input.trialEndsAt, subscription: input.subscription, graceDays: dependencies.graceDays });
      return hasEntitlement(state);
    },
  };
}

// Capability catalog (docs/10.1-subscription-plans-and-limits.md §48, §50). Read/write are kept
// separate so EXPIRED_READ_ONLY can keep historical data visible while blocking new writes.
export const CAPABILITY_KEYS = [
  "accounts.read",
  "accounts.create",
  "categories.create",
  "transactions.read",
  "transactions.create",
  "transactions.edit",
  "transfers.create",
  "debts.read",
  "debts.create",
  "debts.pay",
  "budgets.read",
  "budgets.create",
  "planning.read",
  "planning.manage",
  "reports.read",
  "ai.categorization",
  "ai.assistant",
  "ai.scenarios",
  "ai.actionPreparation",
  "notifications.in_app",
  "notifications.realtime",
  "notifications.email",
  "notifications.whatsapp",
  "exports.data",
  "billing.manage",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

const READ_ONLY_CAPABILITIES: ReadonlySet<CapabilityKey> = new Set([
  "accounts.read",
  "transactions.read",
  "debts.read",
  "budgets.read",
  "planning.read",
  "reports.read",
  "notifications.in_app",
  "exports.data",
  "billing.manage",
]);

// Every capability not in READ_ONLY_CAPABILITIES is a write/premium capability, blocked once
// access is EXPIRED_READ_ONLY. TRIAL and PRO share the same entitlement surface — the trial
// demonstrates the full product (docs/10.1 §9-11); only numeric allowances differ (see limits.ts).
export const ENTITLEMENT_MATRIX: Record<ProductAccessState, Record<CapabilityKey, boolean>> = {
  TRIAL: Object.fromEntries(CAPABILITY_KEYS.map((key) => [key, true])) as Record<CapabilityKey, boolean>,
  PRO: Object.fromEntries(CAPABILITY_KEYS.map((key) => [key, true])) as Record<CapabilityKey, boolean>,
  EXPIRED_READ_ONLY: Object.fromEntries(CAPABILITY_KEYS.map((key) => [key, READ_ONLY_CAPABILITIES.has(key)])) as Record<CapabilityKey, boolean>,
  // Same read-only surface as EXPIRED_READ_ONLY — in practice the routing guard sends a
  // NO_ACCESS user to /elegir-acceso before any of these checks are ever reached, but a direct
  // call still gets the same safe, non-destructive treatment rather than a hard crash.
  NO_ACCESS: Object.fromEntries(CAPABILITY_KEYS.map((key) => [key, READ_ONLY_CAPABILITIES.has(key)])) as Record<CapabilityKey, boolean>,
};

export function hasCapability(state: ProductAccessState, capability: CapabilityKey): boolean {
  return ENTITLEMENT_MATRIX[state][capability];
}

export function listEntitlements(state: ProductAccessState): Record<CapabilityKey, boolean> {
  return ENTITLEMENT_MATRIX[state];
}
