import { accountRepository, transactionRepository, createUserRepository, db } from "@know-finanzas/db";
import { ACTIVATION_V1_MIN_TRANSACTIONS, evaluateActivationV1 } from "@know-finanzas/analytics";
import { analyticsEventRepository, analyticsService, isInternalAccount } from "./analytics-service.instance";

const users = createUserRepository(db);

// Called after any signal that could newly satisfy activation:v1 (a transaction is created, or
// the dashboard/cashflow view fires) — cheap enough to call eagerly rather than needing a
// separate scheduled sweep, and safe to call redundantly: user_activated's own eventId
// (`user_activated:v1:{userId}`) makes AnalyticsService.track() a no-op once it's already fired
// once (Acceptance Criterion: "emitted exactly once per user").
export async function checkAndEmitActivation(userId: string): Promise<void> {
  const user = await users.findById(userId);
  if (!user) return;

  const windowStart = user.createdAt;
  const now = new Date();

  const [accounts, transactions, dashboardViewed, cashflowViewed] = await Promise.all([
    accountRepository.listForUser(userId),
    transactionRepository.listForUser(userId, { limit: ACTIVATION_V1_MIN_TRANSACTIONS + 1 }),
    analyticsEventRepository.hasEventForUserSince("dashboard_viewed", userId, windowStart),
    analyticsEventRepository.hasEventForUserSince("cashflow_viewed", userId, windowStart),
  ]);

  const activated = evaluateActivationV1({
    accountCount: accounts.length,
    transactionCount: transactions.length,
    dashboardViewed,
    cashflowViewed,
    signupAt: windowStart,
    now,
  });

  if (!activated) return;

  await analyticsService(
    "user_activated",
    { activationVersion: "v1" },
    { eventId: `user_activated:v1:${userId}`, userId, internal: isInternalAccount(user.email) },
  );
}
