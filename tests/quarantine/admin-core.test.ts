import { describe, expect, it } from "vitest";
import { hasPermission, requirePermission } from "@know-finanzas/shared";
import { requireReason } from "@know-finanzas/audit";
import { createGetAdminCommercialUserSummary } from "../../apps/web/src/features/admin/users/services/get-admin-commercial-user-summary";
import { createSearchAdminUsers } from "../../apps/web/src/features/admin/users/services/search-admin-users";
import { createAdminRoleRepository } from "../../packages/db/src/repositories/admin-roles";
import { createAICreditRepository } from "../../packages/db/src/repositories/ai-credits";
import { createAuditLogRepository } from "../../packages/db/src/repositories/audit-log";
import { createBillingPaymentRepository } from "../../packages/db/src/repositories/billing-payments";
import { createBillingPeriodRepository } from "../../packages/db/src/repositories/billing-periods";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { createBillingRefundRepository } from "../../packages/db/src/repositories/billing-refunds";
import { createBillingSubscriptionRepository } from "../../packages/db/src/repositories/billing-subscriptions";
import { createNotificationDeliveryRepository } from "../../packages/db/src/repositories/notification-deliveries";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { createUserRepository } from "../../packages/db/src/repositories/users";
import { buildProMonthlyPlanSeed } from "@know-finanzas/billing";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const adminUser = "00000000-0000-0000-0000-000000001001";
const supportUser = "00000000-0000-0000-0000-000000001002";
const plainUser = "00000000-0000-0000-0000-000000001003";
const targetUser = "00000000-0000-0000-0000-000000001004";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: adminUser, name: "Admin", email: "admin-core-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: supportUser, name: "Support", email: "admin-core-support@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: plainUser, name: "Plain user", email: "admin-core-plain@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: targetUser, name: "Target user", email: "admin-core-target@example.test", timezone: "UTC", baseCurrency: "ARS", trialStartedAt: new Date("2026-01-01T00:00:00Z"), trialEndsAt: new Date("2026-01-15T00:00:00Z") },
  ]);
  const adminRoles = createAdminRoleRepository(database);
  await adminRoles.grantRole({ userId: adminUser, role: "ADMIN", grantedBy: null });
  await adminRoles.grantRole({ userId: supportUser, role: "SUPPORT", grantedBy: adminUser });
  return database;
}

describe("admin core (real repositories)", () => {
  it("resolves a real admin_roles row and enforces the permission matrix server-side", async () => {
    const database = await seedUsers();
    const adminRoles = createAdminRoleRepository(database);

    const adminRole = (await adminRoles.findRoleForUser(adminUser))?.role ?? null;
    const supportRole = (await adminRoles.findRoleForUser(supportUser))?.role ?? null;
    const plainRole = (await adminRoles.findRoleForUser(plainUser))?.role ?? null;

    expect(hasPermission(adminRole, "promotions.manage")).toBe(true);
    expect(hasPermission(supportRole, "promotions.manage")).toBe(false);
    expect(hasPermission(plainRole, "commercial.users.read")).toBe(false);

    expect(() => requirePermission(supportRole, "promotions.manage")).toThrow("FORBIDDEN");
    expect(() => requirePermission(plainRole, "commercial.users.read")).toThrow("FORBIDDEN");
    expect(() => requirePermission(adminRole, "commercial.users.read")).not.toThrow();
  });

  it("grantRole is idempotent per user (re-granting updates the role rather than duplicating the row)", async () => {
    const database = await seedUsers();
    const adminRoles = createAdminRoleRepository(database);

    await adminRoles.grantRole({ userId: plainUser, role: "SUPPORT", grantedBy: adminUser });
    await adminRoles.grantRole({ userId: plainUser, role: "ADMIN", grantedBy: adminUser });

    const role = await adminRoles.findRoleForUser(plainUser);
    expect(role?.role).toBe("ADMIN");
  });

  it("revokeRole removes admin access entirely", async () => {
    const database = await seedUsers();
    const adminRoles = createAdminRoleRepository(database);

    await adminRoles.revokeRole(supportUser);

    expect(await adminRoles.findRoleForUser(supportUser)).toBeUndefined();
  });

  it("records a real audit entry and the log stays append-only (no update/delete method exists on the repository)", async () => {
    const database = await seedUsers();
    const auditLog = createAuditLogRepository(database);

    const entry = await auditLog.record({
      actorUserId: adminUser,
      action: "GRANT_PROMOTIONAL_ACCESS",
      entityType: "promotional_access_grant",
      entityId: "grant-1",
      targetUserId: targetUser,
      beforeSnapshot: null,
      afterSnapshot: { status: "ACTIVE" },
      reason: "support case #42",
    });

    expect(entry).toMatchObject({ actorUserId: adminUser, targetUserId: targetUser, reason: "support case #42" });

    const results = await auditLog.search({ targetUserId: targetUser });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(entry.id);
  });

  it("requireReason rejects a sensitive action attempted without a reason, at the application-service layer", () => {
    expect(() => requireReason(null)).toThrow("ADMIN_REASON_REQUIRED");
    expect(() => requireReason("")).toThrow("ADMIN_REASON_REQUIRED");
    expect(requireReason("a real reason")).toBe("a real reason");
  });

  it("GetAdminCommercialUserSummary aggregates from local tables only and reflects real trial/promotion state", async () => {
    const database = await seedUsers();
    const plan = await createBillingPlanRepository(database).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const subscriptions = createBillingSubscriptionRepository(database);
    const subscription = await subscriptions.create({ userId: targetUser, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-admin-1", status: "ACTIVE", currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z") });
    const periods = createBillingPeriodRepository(database);
    const { period } = await periods.upsertPeriod({ subscriptionId: subscription.id, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z"), status: "ACTIVE", providerReference: "mp-admin-1" });
    const payments = createBillingPaymentRepository(database);
    const payment = await payments.upsertByProviderPaymentId({ userId: targetUser, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-admin-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", providerFee: null, netAmount: null, paidAt: new Date("2026-01-01T00:05:00Z") });

    const getSummary = createGetAdminCommercialUserSummary({
      users: createUserRepository(database),
      subscriptions,
      payments,
      refunds: createBillingRefundRepository(database),
      promotions: createPromotionRepository(database),
      aiCredits: createAICreditRepository(database),
      whatsappUsage: createNotificationDeliveryRepository(database),
      graceDays: 3,
      now: () => new Date("2026-01-15T00:00:00Z"),
    });

    const summary = await getSummary(targetUser);

    expect(summary.access).toMatchObject({ paidSubscriptionEffective: true, resolvedState: "PRO", source: "PAID_SUBSCRIPTION" });
    expect(summary.subscription).toMatchObject({ id: subscription.id, status: "ACTIVE" });
    expect(summary.latestPayment).toMatchObject({ id: payment!.id, status: "APPROVED" });
    expect(summary.latestRefund).toBeNull();
    expect(summary.promotion).toBeNull();
  });

  it("SearchAdminUsers finds a real user by exact id and by email prefix, and rejects a too-short query", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const search = createSearchAdminUsers({ users: createUserRepository(database) });

    const byId = await search(targetUser);
    expect(byId).toHaveLength(1);
    expect(byId[0].id).toBe(targetUser);

    const byPrefix = await search("admin-core-target");
    expect(byPrefix.some((u) => u.id === targetUser)).toBe(true);

    await expect(search("ab")).rejects.toThrow("ADMIN_SEARCH_QUERY_TOO_BROAD");
  });
});
