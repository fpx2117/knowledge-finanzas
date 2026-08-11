import { isAIError, type AIErrorCode } from "@know-finanzas/ai";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

const aiMessages: Record<AIErrorCode, string> = {
  AI_DISABLED: "La IA no está disponible en este momento.",
  AI_ACCESS_REQUIRED: "Reactivá tu suscripción para usar la IA.",
  AI_ENTITLEMENT_REQUIRED: "Esta función no está disponible en tu plan actual.",
  AI_CREDITS_EXHAUSTED: "Ya usaste todos tus créditos de IA disponibles.",
  AI_CREDIT_RESERVATION_FAILED: "No pudimos reservar créditos de IA. Intentá nuevamente.",
  AI_CREDIT_OPERATION_DUPLICATE: "Esta solicitud ya fue procesada.",
  AI_USAGE_LIMIT_REACHED: "Alcanzaste el límite de uso de IA.",
  AI_USAGE_RATE_LIMITED: "Hiciste demasiadas solicitudes de IA. Esperá un momento y volvé a intentar.",
  AI_TIMEOUT: "La solicitud de IA tardó demasiado. Intentá nuevamente.",
  AI_RATE_LIMITED: "El proveedor de IA está limitando solicitudes. Intentá en unos segundos.",
  AI_INVALID_OUTPUT: "No pudimos generar una respuesta válida.",
  AI_MODEL_UNAVAILABLE: "El modelo de IA no está disponible en este momento.",
  AI_MODEL_UNSUPPORTED: "Esta capability no es compatible con el modelo configurado.",
  AI_PROVIDER_ERROR: "No pudimos conectar con el proveedor de IA. Intentá nuevamente.",
};

export function mapAIActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isAIError(error)) return { code: error.code, message: aiMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
