import { NotificationError } from "../errors";
import type { NotificationChannel, NotificationSubjectType, NotificationType } from "../domain/types";
import type { SendEmailDeliveryResult } from "./send-email-delivery";
import type { SendWhatsAppDeliveryResult } from "./send-whatsapp-delivery";

export type RetryDeliveryRecord = { id: string; notificationId: string; channel: NotificationChannel; status: string };
export type RetryNotificationRecord = { id: string; userId: string; type: NotificationType; metadata: unknown; subjectType: NotificationSubjectType; subjectId: string | null };

export type RetryDeliveryRepository = {
  findDeliveryById(deliveryId: string): Promise<RetryDeliveryRecord | undefined>;
  findNotificationById(notificationId: string): Promise<RetryNotificationRecord | undefined>;
};

export type SendEmailDeliveryFn = (input: { deliveryId: string; to: string; type: NotificationType; metadata: unknown; actionUrl: string | null }) => Promise<SendEmailDeliveryResult>;
export type SendWhatsAppDeliveryFn = (input: { deliveryId: string; to: string; type: NotificationType; metadata: unknown }) => Promise<SendWhatsAppDeliveryResult>;

// Admin-only "Retry Delivery" (TASK-060 Scope: "only for technically failed transactional
// deliveries, never a new logical notification") — this never creates a new notification or
// delivery row, it only re-attempts sending the exact same already-planned one. IN_APP/REALTIME
// have no send step to retry (they're satisfied by persistence alone), so retrying them is
// rejected rather than silently doing nothing.
export function createRetryDelivery(dependencies: {
  repository: RetryDeliveryRepository;
  resolveEmailRecipient: (userId: string) => Promise<string | null>;
  resolveWhatsAppRecipient: (userId: string) => Promise<string | null>;
  resolveActionUrl: (notification: RetryNotificationRecord) => string | null;
  sendEmailDelivery?: SendEmailDeliveryFn;
  sendWhatsAppDelivery?: SendWhatsAppDeliveryFn;
}) {
  return async function retryDelivery(deliveryId: string): Promise<SendEmailDeliveryResult | SendWhatsAppDeliveryResult> {
    const delivery = await dependencies.repository.findDeliveryById(deliveryId);
    if (!delivery) throw new NotificationError("NOTIFICATION_NOT_FOUND");
    if (delivery.status !== "FAILED") throw new NotificationError("NOTIFICATION_DELIVERY_NOT_RETRYABLE");

    const notification = await dependencies.repository.findNotificationById(delivery.notificationId);
    if (!notification) throw new NotificationError("NOTIFICATION_NOT_FOUND");

    if (delivery.channel === "EMAIL") {
      if (!dependencies.sendEmailDelivery) throw new NotificationError("NOTIFICATION_DELIVERY_NOT_RETRYABLE");
      const to = await dependencies.resolveEmailRecipient(notification.userId);
      if (!to) throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT");
      return dependencies.sendEmailDelivery({ deliveryId, to, type: notification.type, metadata: notification.metadata, actionUrl: dependencies.resolveActionUrl(notification) });
    }

    if (delivery.channel === "WHATSAPP") {
      if (!dependencies.sendWhatsAppDelivery) throw new NotificationError("NOTIFICATION_DELIVERY_NOT_RETRYABLE");
      const to = await dependencies.resolveWhatsAppRecipient(notification.userId);
      if (!to) throw new NotificationError("NOTIFICATION_INVALID_RECIPIENT");
      return dependencies.sendWhatsAppDelivery({ deliveryId, to, type: notification.type, metadata: notification.metadata });
    }

    throw new NotificationError("NOTIFICATION_DELIVERY_NOT_RETRYABLE");
  };
}
