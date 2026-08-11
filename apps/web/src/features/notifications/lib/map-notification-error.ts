import { isNotificationError, type NotificationErrorCode } from "@know-finanzas/notifications";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

const notificationMessages: Record<NotificationErrorCode, string> = {
  NOTIFICATION_NOT_FOUND: "No encontramos esta notificación.",
  NOTIFICATION_INVALID_SUBJECT: "Esta notificación no está vinculada correctamente.",
  NOTIFICATION_CHANNEL_DISABLED: "Este canal está deshabilitado.",
  NOTIFICATION_PREFERENCE_DISABLED: "Desactivaste este tipo de aviso.",
  NOTIFICATION_CHANNEL_NOT_ENTITLED: "Este canal no está disponible en tu plan actual.",
  WHATSAPP_NOT_OPTED_IN: "Activá WhatsApp antes de recibir avisos por ese canal.",
  WHATSAPP_INVALID_PHONE: "Ingresá un número en formato internacional, por ejemplo +5491122334455.",
  NOTIFICATION_PROVIDER_ERROR: "No pudimos enviar el aviso en este momento. Vamos a reintentarlo.",
  NOTIFICATION_INVALID_RECIPIENT: "No pudimos entregar el aviso a este destinatario.",
  NOTIFICATION_WEBHOOK_INVALID: "El evento recibido no es válido.",
  WHATSAPP_PROVIDER_ERROR: "No pudimos enviar el mensaje de WhatsApp en este momento.",
  WHATSAPP_LIMIT_REACHED: "Alcanzaste el límite de mensajes de WhatsApp de tu plan.",
  WHATSAPP_TEMPLATE_NOT_CONFIGURED: "Este tipo de aviso todavía no está disponible por WhatsApp.",
  NOTIFICATION_DELIVERY_NOT_RETRYABLE: "Este envío no se puede reintentar.",
};

export function mapNotificationActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isNotificationError(error)) return { code: error.code, message: notificationMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
