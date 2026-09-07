import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createNotificationRepository } from "../../packages/db/src/repositories/notifications";
import { createNotificationService } from "../../apps/web/src/features/notifications/services/notification-service";
import { notifications, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-SHELL-HEADER (spec 13 §17): the notification center orders by §17.4 (security → financial
// risk → billing → reminders → system → product), marking read never touches the domain, and a
// missing/other-user notification is never returned.

const userId = "00000000-0000-0000-0000-00000000e001";
const otherId = "00000000-0000-0000-0000-00000000e002";
const now = () => new Date("2026-04-01T12:00:00Z");

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userId, name: "User", email: "notif-center@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: otherId, name: "Other", email: "notif-other@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  const base = { userId, titleKey: "x", bodyKey: "x", subjectType: "NONE" as const };
  await database.insert(notifications).values([
    { ...base, id: "e0000000-0000-0000-0000-0000000000a1", type: "PROMOTION_STARTED", category: "PRODUCT", priority: "NORMAL", createdAt: new Date("2026-03-31T10:00:00Z") },
    { ...base, id: "e0000000-0000-0000-0000-0000000000a2", type: "BUDGET_EXCEEDED", category: "FINANCIAL", priority: "HIGH", subjectType: "BUDGET", subjectId: "b0000000-0000-0000-0000-0000000000b1", createdAt: new Date("2026-03-30T10:00:00Z") },
    { ...base, id: "e0000000-0000-0000-0000-0000000000a3", type: "NEW_LOGIN", category: "SECURITY", priority: "HIGH", createdAt: new Date("2026-03-29T10:00:00Z") },
    { ...base, id: "e0000000-0000-0000-0000-0000000000a4", type: "DEBT_DUE_SOON", category: "FINANCIAL", priority: "NORMAL", subjectType: "DEBT", subjectId: "d0000000-0000-0000-0000-0000000000d1", createdAt: new Date("2026-03-28T10:00:00Z") },
    { ...base, id: "e0000000-0000-0000-0000-0000000000a5", type: "PAYMENT_FAILED", category: "BILLING", priority: "HIGH", createdAt: new Date("2026-03-27T10:00:00Z") },
  ]);
  // A notification belonging to someone else — must never surface for `userId`.
  await database.insert(notifications).values({ userId: otherId, id: "e0000000-0000-0000-0000-0000000000ff", type: "NEW_LOGIN", category: "SECURITY", priority: "HIGH", titleKey: "x", bodyKey: "x", subjectType: "NONE" });

  return { database, service: createNotificationService({ notifications: createNotificationRepository(database), now }) };
}

describe("notification center (spec 13 §17)", () => {
  it("orders the inbox: security, then financial risk, then billing, then reminders, then product", async () => {
    const { service } = await seed();
    const { items } = await service.getInbox(userId);

    expect(items.map((i) => i.category)).toEqual(["SECURITY", "FINANCIAL", "BILLING", "FINANCIAL", "PRODUCT"]);
    // The reminder-type financial notification (DEBT_DUE_SOON) sinks below billing (§17.4 rank 3).
    expect(items[1].title).toMatch(/presupuesto/i);
    expect(items[3].title).toMatch(/cuota/i);
  });

  it("resolves a deep-link route for actionable notifications, null otherwise", async () => {
    const { service } = await seed();
    const { items } = await service.getInbox(userId);
    const byTitle = Object.fromEntries(items.map((i) => [i.title, i.href]));
    expect(byTitle["Superaste un presupuesto"]).toBe("/budgets/b0000000-0000-0000-0000-0000000000b1");
    expect(byTitle["Nuevo inicio de sesión"]).toBeNull();
  });

  it("never returns another user's notification", async () => {
    const { service } = await seed();
    const { items } = await service.getInbox(userId);
    expect(items.map((i) => i.id)).not.toContain("e0000000-0000-0000-0000-0000000000ff");
  });

  it("markRead flips readAt without touching the row's type/subject; markAllRead clears the rest", async () => {
    const { database, service } = await seed();

    const before = await service.getInbox(userId);
    expect(before.unreadCount).toBe(5);

    await service.markRead(userId, before.items[0].id);
    const [row] = await database.select().from(notifications).where(eq(notifications.id, before.items[0].id));
    expect(row.readAt).not.toBeNull();
    expect(row.type).toBe("NEW_LOGIN"); // domain untouched (§17.6)

    const { count } = await service.markAllRead(userId);
    expect(count).toBe(4);
    expect((await service.getInbox(userId)).unreadCount).toBe(0);
  });

  it("markRead rejects another user's notification", async () => {
    const { service } = await seed();
    await expect(service.markRead(userId, "e0000000-0000-0000-0000-0000000000ff")).rejects.toMatchObject({ code: "NOTIFICATION_NOT_FOUND" });
  });
});
