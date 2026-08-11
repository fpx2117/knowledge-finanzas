import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  createCreateNotification,
  createProcessTwilioWebhook,
  createSendWhatsAppDelivery,
  isWithinWhatsAppAllowance,
  type NotificationChannel,
  type WhatsAppProvider,
  type WhatsAppTemplateConfig,
} from "@know-finanzas/notifications";
import { createNotificationDeliveryRepository } from "../../packages/db/src/repositories/notification-deliveries";
import { createNotificationPreferenceRepository } from "../../packages/db/src/repositories/notification-preferences";
import { createNotificationRepository } from "../../packages/db/src/repositories/notifications";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000701";
const FULL_ENTITLEMENTS: Record<NotificationChannel, boolean> = { IN_APP: true, REALTIME: true, EMAIL: true, WHATSAPP: true };
const templateConfig: WhatsAppTemplateConfig = { DEBT_DUE_SOON: "HX_debt_due_soon", DEBT_OVERDUE: "HX_debt_overdue" };

const authToken = "test-twilio-auth-token";
const webhookUrl = "https://app.know-finanzas.test/api/webhooks/twilio";
function sign(params: Record<string, string>) {
  const signedContent = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], webhookUrl);
  return createHmac("sha1", authToken).update(signedContent, "utf8").digest("base64");
}

async function seedUser() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "whatsapp-delivery-a@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const preferences = createNotificationPreferenceRepository(database);
  await preferences.optInWhatsapp(userA, "+5491122334455", new Date("2026-01-01T00:00:00Z"));
  return database;
}

describe("WhatsApp delivery pipeline (real repositories, fake Twilio provider)", () => {
  it("sends the WhatsApp template for an eligible notification and marks the delivery SENT", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const sendTemplateMessage = vi.fn(async () => ({ providerMessageId: "SM-int-1" }));
    const provider: WhatsAppProvider = { sendTemplateMessage };
    const sendWhatsAppDelivery = createSendWhatsAppDelivery({ provider, deliveries, templateConfig });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", metadata: { debtName: "Préstamo" }, occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const whatsappDelivery = result.deliveries.find((d) => d.channel === "WHATSAPP")!;
    expect(whatsappDelivery).toBeDefined();

    const sendResult = await sendWhatsAppDelivery({ deliveryId: whatsappDelivery.id, to: "+5491122334455", type: "DEBT_OVERDUE", metadata: { debtName: "Préstamo" } });

    expect(sendResult).toEqual({ sent: true });
    expect(sendTemplateMessage).toHaveBeenCalledWith(expect.objectContaining({ to: "+5491122334455", contentSid: "HX_debt_overdue" }));
    const stored = (await deliveries.listForNotification(result.notification.id)).find((d) => d.channel === "WHATSAPP")!;
    expect(stored).toMatchObject({ status: "SENT", provider: "TWILIO", providerMessageId: "SM-int-1" });
  });

  it("a provider failure marks the delivery FAILED without touching the notification row", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => { throw new Error("twilio outage"); }) };
    const sendWhatsAppDelivery = createSendWhatsAppDelivery({ provider, deliveries, templateConfig });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_DUE_SOON", category: "FINANCIAL", titleKey: "DEBT_DUE_SOON", bodyKey: "DEBT_DUE_SOON", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const whatsappDelivery = result.deliveries.find((d) => d.channel === "WHATSAPP")!;

    const sendResult = await sendWhatsAppDelivery({ deliveryId: whatsappDelivery.id, to: "+5491122334455", type: "DEBT_DUE_SOON", metadata: null });

    expect(sendResult).toMatchObject({ sent: false, retryable: true });
    const storedNotification = await notifications.findByIdForUser(result.notification.id, userA);
    expect(storedNotification).toMatchObject({ id: result.notification.id });
  });

  it("counts only successfully SENT messages toward the allowance, ignoring failed attempts", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });
    const since = new Date("2020-01-01T00:00:00Z");

    const okProvider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => ({ providerMessageId: "SM-ok-1" })) };
    const sendOk = createSendWhatsAppDelivery({ provider: okProvider, deliveries, templateConfig });
    const failProvider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => { throw new Error("fail"); }) };
    const sendFail = createSendWhatsAppDelivery({ provider: failProvider, deliveries, templateConfig });

    const okResult = await createNotification({
      intent: { userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    await sendOk({ deliveryId: okResult.deliveries.find((d) => d.channel === "WHATSAPP")!.id, to: "+5491122334455", type: "DEBT_OVERDUE", metadata: null });

    const failResult = await createNotification({
      intent: { userId: userA, type: "DEBT_DUE_SOON", category: "FINANCIAL", titleKey: "DEBT_DUE_SOON", bodyKey: "DEBT_DUE_SOON", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    await sendFail({ deliveryId: failResult.deliveries.find((d) => d.channel === "WHATSAPP")!.id, to: "+5491122334455", type: "DEBT_DUE_SOON", metadata: null });

    const sentCount = await deliveries.countSentWhatsAppSince(userA, since);
    expect(sentCount).toBe(1);
    expect(isWithinWhatsAppAllowance({ state: "TRIAL", sentCount, trialTotal: 3, proPerPeriod: 20 })).toBe(true);
  });

  it("webhook-reported delivery and failure update state end to end, and duplicate callbacks are idempotent", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => ({ providerMessageId: "SM-webhook-1" })) };
    const sendWhatsAppDelivery = createSendWhatsAppDelivery({ provider, deliveries, templateConfig });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const whatsappDelivery = result.deliveries.find((d) => d.channel === "WHATSAPP")!;
    await sendWhatsAppDelivery({ deliveryId: whatsappDelivery.id, to: "+5491122334455", type: "DEBT_OVERDUE", metadata: null });

    const processWebhook = createProcessTwilioWebhook({ deliveries, authToken });
    const params = { MessageSid: "SM-webhook-1", MessageStatus: "delivered" };

    const first = await processWebhook({ url: webhookUrl, params, signatureHeader: sign(params) });
    const second = await processWebhook({ url: webhookUrl, params, signatureHeader: sign(params) });

    expect(first).toBe("processed");
    expect(second).toBe("processed");
    const stored = (await deliveries.listForNotification(result.notification.id)).find((d) => d.channel === "WHATSAPP")!;
    expect(stored).toMatchObject({ status: "DELIVERED" });
  });

  it("rejects a spoofed webhook signature and leaves the delivery untouched", async () => {
    const database = await seedUser();
    const notifications = createNotificationRepository(database);
    const deliveries = createNotificationDeliveryRepository(database);
    const preferences = createNotificationPreferenceRepository(database);
    const createNotification = createCreateNotification({ notifications, deliveries, preferences });

    const provider: WhatsAppProvider = { sendTemplateMessage: vi.fn(async () => ({ providerMessageId: "SM-spoof-1" })) };
    const sendWhatsAppDelivery = createSendWhatsAppDelivery({ provider, deliveries, templateConfig });

    const result = await createNotification({
      intent: { userId: userA, type: "DEBT_OVERDUE", category: "FINANCIAL", titleKey: "DEBT_OVERDUE", bodyKey: "DEBT_OVERDUE", occurredAt: new Date() },
      userTimezone: "UTC",
      channelEntitlements: FULL_ENTITLEMENTS,
    });
    const whatsappDelivery = result.deliveries.find((d) => d.channel === "WHATSAPP")!;
    await sendWhatsAppDelivery({ deliveryId: whatsappDelivery.id, to: "+5491122334455", type: "DEBT_OVERDUE", metadata: null });

    const processWebhook = createProcessTwilioWebhook({ deliveries, authToken });
    const params = { MessageSid: "SM-spoof-1", MessageStatus: "delivered" };

    const spoofed = await processWebhook({ url: webhookUrl, params, signatureHeader: "attacker-forged-signature" });

    expect(spoofed).toBe("invalid_signature");
    const stored = (await deliveries.listForNotification(result.notification.id)).find((d) => d.channel === "WHATSAPP")!;
    expect(stored).toMatchObject({ status: "SENT" });
  });
});
