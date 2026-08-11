import { describe, expect, it } from "vitest";
import { createCreateNotification, isRuleEligibleForAccess, type NotificationChannel, type NotificationIntent } from "@know-finanzas/notifications";
import { createNotificationDeliveryRepository } from "../../packages/db/src/repositories/notification-deliveries";
import { createNotificationPreferenceRepository } from "../../packages/db/src/repositories/notification-preferences";
import { createNotificationRepository } from "../../packages/db/src/repositories/notifications";
import { createBudgetAlertRepository } from "../../packages/db/src/repositories/budget-alerts";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { createBudgetQueries } from "../../packages/db/src/queries";
import { createBudgetService } from "../../apps/web/src/features/budgets/services/budget-service";
import { createEvaluateFinancialAlerts } from "../../apps/web/src/features/notifications/services/evaluate-financial-alerts";
import { createHandlePaymentFailure } from "@know-finanzas/billing";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { buildProMonthlyPlanSeed } from "@know-finanzas/billing";
import { accounts, debtInstallments, debts, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000501";

const FULL_ENTITLEMENTS: Record<NotificationChannel, boolean> = { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true };

function buildNotify(database: ReturnType<typeof getTestDatabase>["db"], hasActivePremiumAccess: boolean) {
  const createNotification = createCreateNotification({
    notifications: createNotificationRepository(database),
    deliveries: createNotificationDeliveryRepository(database),
    preferences: createNotificationPreferenceRepository(database),
  });
  return async (input: { userId: string; userTimezone: string; intent: Omit<NotificationIntent, "userId"> }) => {
    if (!isRuleEligibleForAccess(input.intent.category, hasActivePremiumAccess)) return { created: false as const };
    return createNotification({ intent: { ...input.intent, userId: input.userId }, userTimezone: input.userTimezone, channelEntitlements: FULL_ENTITLEMENTS });
  };
}

async function seedUser() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "rules-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
  return database;
}

describe("notification rules (real repositories)", () => {
  it("budget threshold crossing creates exactly one notification, not one per re-evaluation", async () => {
    const database = await seedUser();
    const categoryId = "20000000-0000-0000-0000-000000000501";
    const accountId = "10000000-0000-0000-0000-000000000501";
    await database.insert(accounts).values({ id: accountId, userId: userA, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "1000", openingDate: "2026-01-01" });
    const categories = createCategoryRepository(database);
    await categories.create({ userId: userA, name: "Comida", type: "EXPENSE", parentId: null });
    const [category] = await categories.listForUser(userA, { type: "EXPENSE" });

    const budgets = createBudgetRepository(database);
    const budget = await budgets.create({ userId: userA, categoryId: category.id, name: null, currencyCode: "ARS", limitAmount: "100", startDate: "2026-01-01" });
    const transactions = createTransactionRepository(database);
    await transactions.create({ userId: userA, accountId, categoryId: category.id, type: "EXPENSE", amount: "150", currencyCode: "ARS", description: "Super", merchant: null, occurredAt: new Date("2026-01-05T12:00:00Z"), postedAt: new Date("2026-01-05T12:00:00Z"), source: "MANUAL", notes: null });

    const notify = buildNotify(database, true);
    const notifyBudgetAlert: Parameters<typeof createBudgetService>[0]["notifyBudgetAlert"] = (input) => notify({
      userId: input.userId,
      userTimezone: input.userTimezone,
      intent: { type: input.alertType, category: "FINANCIAL", priority: input.alertType === "BUDGET_EXCEEDED" ? "HIGH" : "NORMAL", titleKey: input.alertType, bodyKey: input.alertType, subjectType: "BUDGET", subjectId: input.budgetId, metadata: { categoryName: input.categoryName, usagePercent: input.usagePercent }, occurredAt: new Date(), dedupKey: `${input.alertType}:${input.budgetId}:${input.periodKey}` },
    });
    const budgetService = createBudgetService({ budgets, categories, budgetQueries: createBudgetQueries(database), budgetAlerts: createBudgetAlertRepository(database), notifyBudgetAlert, now: () => new Date("2026-01-20T00:00:00Z") });

    await budgetService.getBudgetAlerts({ id: userA, timezone: "UTC" });
    await budgetService.getBudgetAlerts({ id: userA, timezone: "UTC" }); // re-evaluate: must not duplicate

    const notifications = createNotificationRepository(database);
    const rows = await notifications.listForUser(userA);
    const budgetNotifications = rows.filter((row) => row.subjectType === "BUDGET" && row.subjectId === budget.id);
    expect(budgetNotifications).toHaveLength(1);
    expect(budgetNotifications[0]).toMatchObject({ type: "BUDGET_EXCEEDED" });
  });

  it("debt due-soon and overdue rules create one notification each and are idempotent on re-evaluation", async () => {
    const database = await seedUser();
    const [debt] = await database.insert(debts).values({ userId: userA, name: "Préstamo", type: "OTHER", currencyCode: "ARS", originalAmount: "200", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    await database.insert(debtInstallments).values([
      { debtId: debt.id, installmentNumber: 1, dueDate: "2026-01-16", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" },
      { debtId: debt.id, installmentNumber: 2, dueDate: "2026-01-10", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" },
    ]);

    const notify = buildNotify(database, true);
    const { createDebtSummaryQueries, createUpcomingObligationQueries } = await import("../../packages/db/src/queries");
    const evaluate = createEvaluateFinancialAlerts({ debts: createDebtSummaryQueries(database), scheduled: createUpcomingObligationQueries(database), promotions: createPromotionRepository(database), notify });

    const now = new Date("2026-01-15T12:00:00Z");
    await evaluate({ userId: userA, userTimezone: "UTC", now, trialEndsAt: null });
    await evaluate({ userId: userA, userTimezone: "UTC", now, trialEndsAt: null }); // idempotent

    const notifications = createNotificationRepository(database);
    const rows = await notifications.listForUser(userA);
    expect(rows.filter((r) => r.type === "DEBT_DUE_SOON")).toHaveLength(1);
    expect(rows.filter((r) => r.type === "DEBT_OVERDUE")).toHaveLength(1);
  });

  it("promotion-expiry reminders fire for a real active grant and are idempotent on re-evaluation", async () => {
    const database = await seedUser();
    const promotions = createPromotionRepository(database);
    const grantResult = await promotions.createManualGrant({
      userId: userA,
      source: "ADMIN_OVERRIDE",
      startsAt: new Date("2026-01-01T00:00:00Z"),
      endsAt: new Date("2026-01-22T00:00:00Z"),
      aiCreditsPerPeriod: 0,
      whatsappMessagesPerPeriod: 0,
      periods: [],
    });
    if (!("grant" in grantResult)) throw new Error("expected a grant");

    const notify = buildNotify(database, true);
    const { createDebtSummaryQueries, createUpcomingObligationQueries } = await import("../../packages/db/src/queries");
    const evaluate = createEvaluateFinancialAlerts({ debts: createDebtSummaryQueries(database), scheduled: createUpcomingObligationQueries(database), promotions, notify });

    // endsAt is exactly 7 days after `now` below.
    const now = new Date("2026-01-15T00:00:00Z");
    await evaluate({ userId: userA, userTimezone: "UTC", now, trialEndsAt: null });
    await evaluate({ userId: userA, userTimezone: "UTC", now, trialEndsAt: null }); // idempotent

    const notifications = createNotificationRepository(database);
    const rows = await notifications.listForUser(userA);
    const promotionEnding = rows.filter((r) => r.type === "PROMOTION_ENDING");
    expect(promotionEnding).toHaveLength(1);
    expect(promotionEnding[0]).toMatchObject({ category: "ACCOUNT" });
    expect(rows.some((r) => r.type.startsWith("SUBSCRIPTION_"))).toBe(false);
  });

  it("does not create FINANCIAL alerts when the user has no active premium access", async () => {
    const database = await seedUser();
    const [debt] = await database.insert(debts).values({ userId: userA, name: "Préstamo", type: "OTHER", currencyCode: "ARS", originalAmount: "100", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    await database.insert(debtInstallments).values({ debtId: debt.id, installmentNumber: 1, dueDate: "2026-01-10", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" });

    const notify = buildNotify(database, false); // EXPIRED_READ_ONLY
    const { createDebtSummaryQueries, createUpcomingObligationQueries } = await import("../../packages/db/src/queries");
    const evaluate = createEvaluateFinancialAlerts({ debts: createDebtSummaryQueries(database), scheduled: createUpcomingObligationQueries(database), promotions: createPromotionRepository(database), notify });

    await evaluate({ userId: userA, userTimezone: "UTC", now: new Date("2026-01-15T12:00:00Z"), trialEndsAt: null });

    const notifications = createNotificationRepository(database);
    await expect(notifications.listForUser(userA)).resolves.toHaveLength(0);
  });

  it("a payment failure that transitions ACTIVE to PAST_DUE creates a PAYMENT_FAILED notification exactly once", async () => {
    const database = await seedUser();
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const subscriptions = createBillingSubscriptionRepository(database);
    const subscription = await subscriptions.create({ userId: userA, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-rules-1", status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") });

    const notify = buildNotify(database, true);
    const handlePaymentFailure = createHandlePaymentFailure({ subscriptions });
    const notifyPaymentFailed = (subscriptionId: string) => notify({ userId: userA, userTimezone: "UTC", intent: { type: "PAYMENT_FAILED", category: "BILLING", priority: "HIGH", titleKey: "PAYMENT_FAILED", bodyKey: "PAYMENT_FAILED", subjectType: "SUBSCRIPTION", subjectId: subscriptionId, occurredAt: new Date(), dedupKey: `PAYMENT_FAILED:${subscriptionId}:2026-01-15` } });

    const first = await handlePaymentFailure(subscription.id);
    if (first.transitioned) await notifyPaymentFailed(subscription.id);
    const second = await handlePaymentFailure(subscription.id); // already PAST_DUE: no-op
    if (second.transitioned) await notifyPaymentFailed(subscription.id);

    expect(first.transitioned).toBe(true);
    expect(second.transitioned).toBe(false);

    const notifications = createNotificationRepository(database);
    const rows = await notifications.listForUser(userA);
    expect(rows.filter((r) => r.type === "PAYMENT_FAILED")).toHaveLength(1);
  });

  it("BILLING-category notifications still fire even without active premium access", async () => {
    const database = await seedUser();
    const notify = buildNotify(database, false);

    await notify({ userId: userA, userTimezone: "UTC", intent: { type: "SUBSCRIPTION_EXPIRED", category: "BILLING", priority: "HIGH", titleKey: "SUBSCRIPTION_EXPIRED", bodyKey: "SUBSCRIPTION_EXPIRED", occurredAt: new Date(), dedupKey: "SUBSCRIPTION_EXPIRED:sub-1" } });

    const notifications = createNotificationRepository(database);
    await expect(notifications.listForUser(userA)).resolves.toHaveLength(1);
  });
});
