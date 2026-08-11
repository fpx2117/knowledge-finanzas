import { isBillingError, type BillingErrorCode } from "@know-finanzas/billing";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

const billingMessages: Record<BillingErrorCode, string> = {
  BILLING_DISABLED: "Las suscripciones no están disponibles en este momento.",
  BILLING_PROVIDER_ERROR: "No pudimos conectar con el proveedor de pagos. Intentá nuevamente.",
  BILLING_PLAN_NOT_FOUND: "No encontramos este plan.",
  BILLING_PLAN_INACTIVE: "Este plan ya no está disponible.",
  BILLING_SUBSCRIPTION_ALREADY_ACTIVE: "Ya tenés una suscripción activa.",
  BILLING_SUBSCRIPTION_PENDING: "Ya tenés una suscripción pendiente de confirmación.",
  BILLING_SUBSCRIPTION_NOT_FOUND: "No encontramos esta suscripción.",
  BILLING_SUBSCRIPTION_ALREADY_CANCELLED: "Esta suscripción ya está cancelada.",
  BILLING_REFRESH_RATE_LIMITED: "Ya actualizamos tu suscripción hace un momento. Esperá unos segundos y volvé a intentar.",
  BILLING_PAYMENT_FAILED: "El pago no pudo procesarse.",
  BILLING_WEBHOOK_INVALID: "El evento recibido no es válido.",
  BILLING_WEBHOOK_DUPLICATE: "Este evento ya fue procesado.",
  BILLING_RECONCILIATION_FAILED: "No pudimos actualizar el estado de la suscripción.",
  BILLING_PAYMENT_NOT_FOUND: "No encontramos este pago.",
  BILLING_REFUND_NOT_AUTHORIZED: "No tenés permisos para realizar esta acción.",
  BILLING_REFUND_REASON_REQUIRED: "Necesitamos un motivo para procesar el reembolso.",
  BILLING_REFUND_PAYMENT_NOT_REFUNDABLE: "Este pago no puede reembolsarse.",
  BILLING_REFUND_AMOUNT_EXCEEDS_PAYMENT: "El monto del reembolso supera el pago original.",
  BILLING_TRIAL_NOT_ELIGIBLE: "No podés iniciar una prueba gratuita en esta cuenta.",
};

export function mapBillingActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isBillingError(error)) return { code: error.code, message: billingMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
