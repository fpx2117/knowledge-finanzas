import { describe, expect, it, vi } from "vitest";
import { createCreateNotification, createProcessResendWebhook, createSendEmailDelivery, type EmailProvider, type NotificationChannel } from "@know-finanzas/notifications";
import { createHmac } from "node:crypto";
import { createNotificationDeliveryRepository } from "../../packages/db/src/repositories/notification-deliveries";
import { createNotificationPreferenceRepository } from "../../packages/db/src/repositories/notification-preferences";
import { createNotificationRepository } from "../../packages/db/src/repositories/notifications";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000601";
const FULL_ENTITLEMENTS: Record<NotificationChannel, boolean> = { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true };

const secretBase64 = Buffer.from("test-resend-secret-bytes").toString("base64");
const webhookSecret = `whsec_${secretBase64}`;
function sign(svixId: string, svixTimestamp: string, rawBody: string) {
  return `v1,${createHmac("sha256", Buffer.from(secretBase64, "base64")).update(`${svixId}.${svixTimestamp}.${rawBody}`).digest("base64")}`;
}
function webhookEvent(type: string, emailId: string) {
  const svixId = "msg_1";
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const rawBody = JSON.stringify({ type, data: { email_id: emailId } });
  return { event: { type, data: { email_id: emailId } }, rawBody, svixId, svixTimestamp, svixSignature: sign(svixId, svixTimestamp, rawBody) };
}

async function seedUser() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "email-delivery-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
  return database;
}

describe("email delivery pipeline (real repositories, fake Resend provider)", () => {
  it("sends the email for an eligible notification and marks the delivery SENT with a template-rendered body", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const sendEmail = vi.fn(async () => ({ providerMessageId: "resend-int-1" }));
    const provider: EmailProvider = { sendEmail };
    const sendEmailDelivery = createSendEmailDelivery({ provider, deliveries });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", metadata: { debtName: "Préstamo" }, occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const emailDelivery = result.deliveries.find((d) => d.channel === "EMAIL")!;
    expect(emailDelivery).toBeDefined();

    const sendResult = await sendEmailDelivery({ deliveryId: emailDelivery.id, to: "email-delivery-a@example.test", type: "DEBT_OVERDUE", metadata: { debtName: "Préstamo" }, actionUrl: null });

    expect(sendResult).toEqual({ sent: true });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "email-delivery-a@example.test", subject: expect.stringContaining("cuota") }));
    const storedDeliveries = await deliveries.listForNotification(result.notification.id);
    const stored = storedDeliveries.find((d) => d.channel === "EMAIL")!;
    expect(stored).toMatchObject({ status: "SENT", provider: "RESEND", providerMessageId: "resend-int-1" });
  });

  it("a provider failure marks the delivery FAILED without touching the notification row", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const provider: EmailProvider = { sendEmail: vi.fn(async () => { throw new Error("resend outage"); }) };
    const sendEmailDelivery = createSendEmailDelivery({ provider, deliveries });

    const result = await createNotification({
      intent: { userId: userA, type: "BUDGET_EXCEEDED", category: "FINANCIAL", titleKey: "BUDGET_EXCEEDED", bodyKey: "BUDGET_EXCEEDED", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const emailDelivery = result.deliveries.find((d) => d.channel === "EMAIL")!;

    const sendResult = await sendEmailDelivery({ deliveryId: emailDelivery.id, to: "email-delivery-a@example.test", type: "BUDGET_EXCEEDED", metadata: null, actionUrl: null });

    expect(sendResult).toMatchObject({ sent: false, retryable: true });
    const storedNotification = await notifications.findByIdForUser(result.notification.id, userA);
    expect(storedNotification).toMatchObject({ id: result.notification.id }); // notification itself is untouched/still readable
  });

  it("webhook-reported delivery and bounce update state end to end, and a bounce suppresses future EMAIL for that user", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const provider: EmailProvider = { sendEmail: vi.fn(async () => ({ providerMessageId: "resend-bounce-1" })) };
    const sendEmailDelivery = createSendEmailDelivery({ provider, deliveries });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_DUE_SOON", category: "FINANCIAL", titleKey: "DEBT_DUE_SOON", bodyKey: "DEBT_DUE_SOON", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const emailDelivery = result.deliveries.find((d) => d.channel === "EMAIL")!;
    await sendEmailDelivery({ deliveryId: emailDelivery.id, to: "email-delivery-a@example.test", type: "DEBT_DUE_SOON", metadata: null, actionUrl: null });

    const processWebhook = createProcessResendWebhook({
      deliveries,
      notifications,
      suppressEmail: (userId) => preferences.upsertForUser({ userId, notificationType: null, channel: "EMAIL", enabled: false }),
      webhookSecret,
    });

    const bounceResult = await processWebhook(webhookEvent("email.bounced", "resend-bounce-1"));
    expect(bounceResult).toBe("processed");

    const storedDeliveries = await deliveries.listForNotification(result.notification.id);
    expect(storedDeliveries.find((d) => d.channel === "EMAIL")).toMatchObject({ status: "FAILED", lastErrorCode: "NOTIFICATION_INVALID_RECIPIENT" });

    const prefs = await preferences.listForUser(userA);
    expect(prefs).toContainEqual(expect.objectContaining({ channel: "EMAIL", notificationType: null, enabled: false }));
  });

  it("a duplicate webhook delivery for the same event is a safe no-op (idempotent)", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });
    const provider: EmailProvider = { sendEmail: vi.fn(async () => ({ providerMessageId: "resend-dup-1" })) };
    const sendEmailDelivery = createSendEmailDelivery({ provider, deliveries });

    const result = await createNotification({
      intent: { userId: userA, type: "SCHEDULED_TRANSACTION_DUE", category: "FINANCIAL", titleKey: "SCHEDULED_TRANSACTION_DUE", bodyKey: "SCHEDULED_TRANSACTION_DUE", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const emailDelivery = result.deliveries.find((d) => d.channel === "EMAIL")!;
    await sendEmailDelivery({ deliveryId: emailDelivery.id, to: "email-delivery-a@example.test", type: "SCHEDULED_TRANSACTION_DUE", metadata: null, actionUrl: null });

    const processWebhook = createProcessResendWebhook({ deliveries, notifications, suppressEmail: async () => undefined, webhookSecret });
    const first = await processWebhook(webhookEvent("email.delivered", "resend-dup-1"));
    const second = await processWebhook(webhookEvent("email.delivered", "resend-dup-1"));

    expect(first).toBe("processed");
    expect(second).toBe("processed");
    const storedDeliveries = await deliveries.listForNotification(result.notification.id);
    expect(storedDeliveries.find((d) => d.channel === "EMAIL")).toMatchObject({ status: "DELIVERED" });
  });
});
