import { resolveProductAccess, type BillingSubscriptionStatus, type ProductAccessState } from "@know-finanzas/billing";
import { ApplicationError } from "@know-finanzas/shared";

type UserAccessRepository = {
  findAccessInputById(userId: string): Promise<{ trialEndsAt: Date | null; trialStartedAt?: Date | null } | undefined>;
};

type SubscriptionAccessRepository = {
  findEffectiveForUser(userId: string): Promise<{ status: BillingSubscriptionStatus; currentPeriodEnd: Date | null } | undefined>;
  // Any status — used only to answer "did this user ever have a subscription at all" (see
  // everHadAccess below), never to resolve current access.
  listForUser?(userId: string): Promise<unknown[]>;
};

// A user has at most one ACTIVE promotional grant (partial unique index in packages/db) — a
// single lookup by userId is all resolveProductAccess needs (task's domain rule: "EffectiveProductAccess
// = PRO when an active promotional grant exists").
type PromotionAccessRepository = {
  findActiveGrantForUser(userId: string): Promise<{ endsAt: Date } | undefined>;
  hasAnyGrantForUser?(userId: string): Promise<boolean>;
};

const noPromotions: PromotionAccessRepository = { findActiveGrantForUser: async () => undefined };

export type ProductAccessGate = {
  getAccessState(userId: string): Promise<ProductAccessState>;
  assertCanWrite(userId: string): Promise<void>;
};

// Server-side gate consumed by application services before any financial write. Read access is
// never blocked here — only the specific create/edit operations enumerated in
// docs/10.1-subscription-plans-and-limits.md §30 call assertCanWrite.
export function createProductAccessGate(dependencies: {
  users: UserAccessRepository;
  subscriptions: SubscriptionAccessRepository;
  // Optional so existing callers/tests that predate TASK-053 keep working unchanged — omitting
  // it just means "this user is never treated as having an active promotion."
  promotions?: PromotionAccessRepository;
  graceDays: number;
  now?: () => Date;
}): ProductAccessGate {
  const now = dependencies.now ?? (() => new Date());
  const promotions = dependencies.promotions ?? noPromotions;

  async function getAccessState(userId: string): Promise<ProductAccessState> {
    const [user, subscription, activePromotion] = await Promise.all([
      dependencies.users.findAccessInputById(userId),
      dependencies.subscriptions.findEffectiveForUser(userId),
      promotions.findActiveGrantForUser(userId),
    ]);

    // NO_ACCESS (TASK-064) vs EXPIRED_READ_ONLY: a brand-new user who completed onboarding but
    // hasn't chosen Trial/Pro/a promo code yet has never had a trial, a subscription (of any
    // status, not just effective), or a promotional grant (of any status, not just active) —
    // distinct from a user whose access genuinely lapsed. Both extra lookups are best-effort
    // (guarded by `?.` + `??`) so any repository/test that predates TASK-064 and doesn't
    // implement them keeps its exact prior EXPIRED_READ_ONLY-on-NONE behavior.
    let everHadAccess = Boolean(user?.trialStartedAt) || Boolean(subscription) || Boolean(activePromotion);
    if (!everHadAccess) {
      const [everSubscribed, everGranted] = await Promise.all([
        dependencies.subscriptions.listForUser?.(userId).then((rows) => rows.length > 0) ?? Promise.resolve(true),
        promotions.hasAnyGrantForUser?.(userId) ?? Promise.resolve(true),
      ]);
      everHadAccess = everSubscribed || everGranted;
    }

    return resolveProductAccess({
      now: now(),
      trialEndsAt: user?.trialEndsAt ?? null,
      subscription: subscription ? { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd } : null,
      activePromotion: activePromotion ? { endsAt: activePromotion.endsAt } : null,
      graceDays: dependencies.graceDays,
      everHadAccess,
    });
  }

  return {
    getAccessState,
    async assertCanWrite(userId: string) {
      const state = await getAccessState(userId);
      if (state === "EXPIRED_READ_ONLY" || state === "NO_ACCESS") throw new ApplicationError("PRODUCT_ACCESS_READ_ONLY");
    },
  };
}

// Permissive default used by services that are not given an explicit gate (e.g. existing unit
// tests constructing a service with fakes only) — never blocks. Production wiring always passes
// the real gate from product-access-gate.instance.ts.
export const allowAllProductAccessGate: ProductAccessGate = {
  getAccessState: async () => "PRO",
  assertCanWrite: async () => {},
};
