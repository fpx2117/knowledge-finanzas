import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createArchiveNotification, createCreateNotification, createMarkNotificationRead, createResolveNotificationPreferences, isNotificationError } from "@know-finanzas/notifications";
import { createNotificationDeliveryRepository } from "../../packages/db/src/repositories/notification-deliveries";
import { createNotificationPreferenceRepository } from "../../packages/db/src/repositories/notification-preferences";
import { createNotificationRepository } from "../../packages/db/src/repositories/notifications";
import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { accounts, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000401";
const userB = "00000000-0000-0000-0000-000000000402";

async function seedTwoUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "notif-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "notif-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

const fullEntitlements = { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true };

describe("notification domain (real repositories)", () => {
  it("persists a notification with its delivery rows separate from the logical notification", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const create = createCreateNotification({ notifications, deliveries, preferences });

    const result = await create({
      intent: { userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "budget.exceeded.title", bodyKey: "budget.exceeded.body", subjectType: "BUDGET", subjectId: null, occurredAt: new Date("2026-01-15T12:00:00Z") },
      userTimezone: "UTC",
      channelEntitlements: fullEntitlements,
    });

    expect(result.created).toBe(true);
    expect(result.deliveries.map((d) => d.channel).sort()).toEqual(["EMAIL", "IN_APP", "REALTIME"]);
    const storedDeliveries = await deliveries.listForNotification(result.notification.id);
    expect(storedDeliveries).toHaveLength(3);
    expect(storedDeliveries.every((d) => d.notificationId === result.notification.id)).toBe(true);
  });

  it("enforces the dedup key uniqueness constraint at the database level, not just in application code", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const first = await notifications.createIfNotDuplicate({ userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b", dedupKey: "debt-overdue:debt-1:2026-01" });
    const second = await notifications.createIfNotDuplicate({ userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b", dedupKey: "debt-overdue:debt-1:2026-01" });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.notification.id).toBe(first.notification.id);
  });

  it("allows the same dedup key for two different users (uniqueness is per-user)", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const a = await notifications.createIfNotDuplicate({ userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b", dedupKey: "same-key" });
    const b = await notifications.createIfNotDuplicate({ userId: userB, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b", dedupKey: "same-key" });

    expect(a.created).toBe(true);
    expect(b.created).toBe(true);
    expect(a.notification.id).not.toBe(b.notification.id);
  });

  it("user A cannot read or modify user B's notification", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const { notification } = await notifications.createIfNotDuplicate({ userId: userB, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });

    const markRead = createMarkNotificationRead({ notifications });
    const archive = createArchiveNotification({ notifications });

    await expect(markRead({ userId: userA, notificationId: notification.id })).rejects.toSatisfy((error) => isNotificationError(error) && error.code === "NOTIFICATION_NOT_FOUND");
    await expect(archive({ userId: userA, notificationId: notification.id })).rejects.toSatisfy((error) => isNotificationError(error) && error.code === "NOTIFICATION_NOT_FOUND");
    await expect(notifications.findByIdForUser(notification.id, userA)).resolves.toBeUndefined();

    await expect(markRead({ userId: userB, notificationId: notification.id })).resolves.toMatchObject({ id: notification.id });
  });

  it("user A cannot see or overwrite user B's notification preferences", async () => {
    const database = await seedTwoUsers();
    const preferences = createNotificationPreferenceRepository(database);
    await preferences.upsertForUser({ userId: userB, notificationType: null, channel: "EMAIL", enabled: false });

    const forA = await preferences.listForUser(userA);
    const forB = await preferences.listForUser(userB);
    expect(forA).toHaveLength(0);
    expect(forB).toHaveLength(1);
  });

  it("global channel OFF (persisted) overrides a per-type ON preference through the real repository", async () => {
    const database = await seedTwoUsers();
    const preferences = createNotificationPreferenceRepository(database);
    await preferences.upsertForUser({ userId: userA, notificationType: null, channel: "EMAIL", enabled: false });
    await preferences.upsertForUser({ userId: userA, notificationType: "BUDGET_EXCEEDED", channel: "EMAIL", enabled: true });

    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const create = createCreateNotification({ notifications, deliveries, preferences });

    const result = await create({
      intent: { userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b", occurredAt: new Date("2026-01-15T12:00:00Z") },
      userTimezone: "UTC",
      channelEntitlements: fullEntitlements,
    });

    expect(result.deliveries.map((d) => d.channel)).not.toContain("EMAIL");
  });

  it("upsertForUser is idempotent per (user, type, channel) — a repeated update replaces, not duplicates", async () => {
    const database = await seedTwoUsers();
    const preferences = createNotificationPreferenceRepository(database);
    await preferences.upsertForUser({ userId: userA, notificationType: null, channel: "WHATSAPP", enabled: true });
    await preferences.upsertForUser({ userId: userA, notificationType: null, channel: "WHATSAPP", enabled: false });

    const rows = await preferences.listForUser(userA);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ enabled: false, channel: "WHATSAPP", notificationType: null });
  });

  it("rejects a non-E.164 WhatsApp phone number at the database constraint level", async () => {
    const database = await seedTwoUsers();
    const preferences = createNotificationPreferenceRepository(database);
    await expect(preferences.optInWhatsapp(userA, "011-2233-4455", new Date())).rejects.toThrow();
  });

  it("increments notification delivery attemptCount correctly (regression: was a no-op stub)", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const { notification } = await notifications.createIfNotDuplicate({ userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });
    const delivery = await deliveries.create({ notificationId: notification.id, channel: "EMAIL" });
    expect(delivery.attemptCount).toBe(0);

    const afterFirst = await deliveries.updateStatus(delivery.id, { status: "SENDING", incrementAttempt: true });
    expect(afterFirst?.attemptCount).toBe(1);
    const afterSecond = await deliveries.updateStatus(delivery.id, { status: "FAILED", incrementAttempt: true });
    expect(afterSecond?.attemptCount).toBe(2);
    const afterNoIncrement = await deliveries.updateStatus(delivery.id, { status: "CANCELLED" });
    expect(afterNoIncrement?.attemptCount).toBe(2);
  });

  it("resolveNotificationPreferences reports entitlement, global default and per-type overrides", async () => {
    const database = await seedTwoUsers();
    const preferences = createNotificationPreferenceRepository(database);
    await preferences.upsertForUser({ userId: userA, notificationType: null, channel: "EMAIL", enabled: false });
    await preferences.upsertForUser({ userId: userA, notificationType: "DEBT_OVERDUE", channel: "EMAIL", enabled: true });

    const resolve = createResolveNotificationPreferences({ preferences });
    const view = await resolve({ userId: userA, channelEntitlements: { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: false } });

    const email = view.channels.find((c) => c.channel === "EMAIL")!;
    expect(email.entitled).toBe(true);
    expect(email.globalEnabled).toBe(false);
    expect(email.typeOverrides).toEqual([{ notificationType: "DEBT_OVERDUE", enabled: true }]);
    const whatsapp = view.channels.find((c) => c.channel === "WHATSAPP")!;
    expect(whatsapp.entitled).toBe(false);
    expect(view.whatsappOptedIn).toBe(false);
  });

  it("creating and archiving notifications never touches accounts or other financial tables", async () => {
    const database = await seedTwoUsers();
    const accountId = "10000000-0000-0000-0000-000000000401";
    await database.insert(accounts).values({ id: accountId, userId: userA, name: "Untouched", type: "BANK", currencyCode: "ARS", openingBalance: "500", openingDate: "2026-01-01" });

    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const create = createCreateNotification({ notifications, deliveries, preferences });
    const { notification } = await create({
      intent: { userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: fullEntitlements,
    });
    await createArchiveNotification({ notifications })({ userId: userA, notificationId: notification.id });

    const accountRepository = createAccountRepository(database);
    await expect(accountRepository.findByIdForUser(accountId, userA)).resolves.toMatchObject({ id: accountId, openingBalance: "500.000000" });
    const [row] = await database.select().from(accounts).where(eq(accounts.id, accountId));
    expect(row.openingBalance).toBe("500.000000");
  });

  it("countUnreadForUser and listForUser are scoped per user (the SSE badge/poll relies on this)", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    await notifications.createIfNotDuplicate({ userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });
    await notifications.createIfNotDuplicate({ userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });
    await notifications.createIfNotDuplicate({ userId: userB, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });

    await expect(notifications.countUnreadForUser(userA)).resolves.toBe(2);
    await expect(notifications.countUnreadForUser(userB)).resolves.toBe(1);
    await expect(notifications.listForUser(userA)).resolves.toHaveLength(2);
    await expect(notifications.listForUser(userB)).resolves.toHaveLength(1);
  });

  it("countUnreadForUser drops after marking read; listForUser excludes archived by default", async () => {
    const database = await seedTwoUsers();
    const notifications = createNotificationRepository(database);
    const { notification } = await notifications.createIfNotDuplicate({ userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });
    await notifications.createIfNotDuplicate({ userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "t", bodyKey: "b" });

    await expect(notifications.countUnreadForUser(userA)).resolves.toBe(2);
    await notifications.markReadForUser(notification.id, userA, new Date());
    await expect(notifications.countUnreadForUser(userA)).resolves.toBe(1);

    await notifications.archiveForUser(notification.id, userA, new Date());
    await expect(notifications.listForUser(userA)).resolves.toHaveLength(1);
    await expect(notifications.listForUser(userA, { includeArchived: true })).resolves.toHaveLength(2);
  });
});
