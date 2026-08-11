import { describe, expect, it } from "vitest";
import { createArchiveNotification, createCreateNotification, createMarkNotificationRead, createWhatsappConsentService, isNotificationError } from "@know-finanzas/notifications";

function fakeNotifications(seed: Array<{ id: string; userId: string; readAt: Date | null; dismissedAt: Date | null }> = []) {
  const records = seed.map((record) => ({ ...record }));
  let counter = 0;
  return {
    records,
    createIfNotDuplicate: async (input: { userId: string; dedupKey?: string | null; scheduledFor?: Date | null }) => {
      if (input.dedupKey) {
        const existing = records.find((record) => (record as unknown as { dedupKey?: string }).dedupKey === input.dedupKey && record.userId === input.userId);
        if (existing) return { notification: existing as never, created: false };
      }
      counter += 1;
      const record = { id: `notif-${counter}`, userId: input.userId, readAt: null, dismissedAt: null, dedupKey: input.dedupKey ?? null, scheduledFor: input.scheduledFor ?? null };
      records.push(record as never);
      return { notification: record as never, created: true };
    },
    findByIdForUser: async (id: string, userId: string) => records.find((record) => record.id === id && record.userId === userId),
    markReadForUser: async (id: string, userId: string, readAt: Date) => {
      const record = records.find((r) => r.id === id && r.userId === userId);
      if (!record) return undefined;
      record.readAt = readAt;
      return record;
    },
    archiveForUser: async (id: string, userId: string, dismissedAt: Date) => {
      const record = records.find((r) => r.id === id && r.userId === userId);
      if (!record) return undefined;
      record.dismissedAt = dismissedAt;
      return record;
    },
  };
}

describe("createNotification", () => {
  function fakeDeliveries() {
    const records: Array<{ id: string; notificationId: string; channel: string; status: string }> = [];
    let counter = 0;
    return {
      records,
      create: async (input: { notificationId: string; channel: string }) => {
        counter += 1;
        const row = { id: `delivery-${counter}`, notificationId: input.notificationId, channel: input.channel, status: "PENDING" };
        records.push(row);
        return row;
      },
      updateStatus: async (id: string, input: { status: string }) => {
        const row = records.find((r) => r.id === id);
        if (row) row.status = input.status;
        return row;
      },
    };
  }

  function fakePreferences(rows: Array<{ notificationType: string | null; channel: string; enabled: boolean }> = [], whatsappOptedIn = false) {
    return {
      listForUser: async () => rows,
      findWhatsappConsentForUser: async () => (whatsappOptedIn ? { optInAt: new Date("2026-01-01T00:00:00Z"), optOutAt: null } : undefined),
    };
  }

  it("creates a notification and a delivery row for every entitled, enabled channel", async () => {
    const notifications = fakeNotifications();
    const deliveries = fakeDeliveries();
    const create = createCreateNotification({ notifications, deliveries, preferences: fakePreferences() });

    const result = await create({
      intent: { userId: "user-1", type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b", occurredAt: new Date("2026-01-15T12:00:00Z") },
      userTimezone: "UTC",
      channelEntitlements: { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: false },
    });

    expect(result.created).toBe(true);
    const channels = result.deliveries.map((d) => d.channel).sort();
    expect(channels).toEqual(["EMAIL", "IN_APP", "REALTIME"]);
    const inApp = result.deliveries.find((d) => d.channel === "IN_APP")!;
    expect(deliveries.records.find((r) => r.id === inApp.id)?.status).toBe("DELIVERED");
  });

  it("skips channels disabled by preference and channels without WhatsApp opt-in", async () => {
    const notifications = fakeNotifications();
    const deliveries = fakeDeliveries();
    const preferences = fakePreferences([{ notificationType: null, channel: "EMAIL", enabled: false }], false);
    const create = createCreateNotification({ notifications, deliveries, preferences });

    const result = await create({
      intent: { userId: "user-1", type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "t", bodyKey: "b", occurredAt: new Date("2026-01-15T12:00:00Z") },
      userTimezone: "UTC",
      channelEntitlements: { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true },
    });

    const channels = result.deliveries.map((d) => d.channel).sort();
    expect(channels).toEqual(["IN_APP", "REALTIME"]);
  });

  it("is idempotent on dedupKey: a repeated intent creates no new deliveries", async () => {
    const notifications = fakeNotifications();
    const deliveries = fakeDeliveries();
    const create = createCreateNotification({ notifications, deliveries, preferences: fakePreferences() });
    const intent = { userId: "user-1", type: "BUDGET_EXCEEDED" as const, category: "FINANCIAL" as const, titleKey: "t", bodyKey: "b", occurredAt: new Date("2026-01-15T12:00:00Z"), dedupKey: "budget-exceeded:cat-1:2026-01" };
    const entitlements = { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true };

    const first = await create({ intent, userTimezone: "UTC", channelEntitlements: entitlements });
    const second = await create({ intent, userTimezone: "UTC", channelEntitlements: entitlements });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.deliveries).toEqual([]);
    expect(deliveries.records).toHaveLength(3); // only from the first call
  });
});

describe("createMarkNotificationRead / createArchiveNotification", () => {
  it("marks a notification read only when owned by the requesting user", async () => {
    const notifications = fakeNotifications([{ id: "n1", userId: "user-1", readAt: null, dismissedAt: null }]);
    const markRead = createMarkNotificationRead({ notifications, now: () => new Date("2026-01-15T00:00:00Z") });

    const updated = await markRead({ userId: "user-1", notificationId: "n1" });
    expect(updated.readAt).toEqual(new Date("2026-01-15T00:00:00Z"));

    await expect(markRead({ userId: "user-2", notificationId: "n1" })).rejects.toSatisfy((error) => isNotificationError(error) && error.code === "NOTIFICATION_NOT_FOUND");
  });

  it("archives a notification only when owned by the requesting user", async () => {
    const notifications = fakeNotifications([{ id: "n1", userId: "user-1", readAt: null, dismissedAt: null }]);
    const archive = createArchiveNotification({ notifications, now: () => new Date("2026-01-15T00:00:00Z") });

    const updated = await archive({ userId: "user-1", notificationId: "n1" });
    expect(updated.dismissedAt).toEqual(new Date("2026-01-15T00:00:00Z"));

    await expect(archive({ userId: "user-2", notificationId: "n1" })).rejects.toSatisfy((error) => isNotificationError(error) && error.code === "NOTIFICATION_NOT_FOUND");
  });
});

describe("createWhatsappConsentService", () => {
  it("rejects a non-E.164 phone number before touching the repository", async () => {
    let calls = 0;
    const consent = { optInWhatsapp: async () => { calls += 1; }, optOutWhatsapp: async () => { calls += 1; } };
    const service = createWhatsappConsentService({ consent });

    await expect(service.optIn({ userId: "user-1", phoneNumber: "011-2233-4455" })).rejects.toSatisfy((error) => isNotificationError(error) && error.code === "WHATSAPP_INVALID_PHONE");
    expect(calls).toBe(0);
  });

  it("accepts a valid E.164 phone number", async () => {
    const calls: unknown[] = [];
    const consent = { optInWhatsapp: async (userId: string, phone: string) => { calls.push([userId, phone]); }, optOutWhatsapp: async () => {} };
    const service = createWhatsappConsentService({ consent, now: () => new Date("2026-01-15T00:00:00Z") });

    await service.optIn({ userId: "user-1", phoneNumber: "+5491122334455" });
    expect(calls).toEqual([["user-1", "+5491122334455"]]);
  });
});
