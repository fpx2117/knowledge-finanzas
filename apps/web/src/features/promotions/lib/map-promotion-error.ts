import { isPromotionError, type PromotionErrorCode } from "@know-finanzas/promotions";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

// Security Requirement (TASK-053/054): invalid, inactive, not-yet-started, expired and
// exhausted codes all collapse to the same generic message — never reveal which specific reason
// applied, or an attacker could enumerate/probe codes by reading the error.
const GENERIC_CODE_MESSAGE = "Ese código no es válido o ya no está disponible.";

const promotionMessages: Record<PromotionErrorCode, string> = {
  PROMOTION_INVALID: GENERIC_CODE_MESSAGE,
  PROMOTION_NOT_ACTIVE: GENERIC_CODE_MESSAGE,
  PROMOTION_NOT_STARTED: GENERIC_CODE_MESSAGE,
  PROMOTION_EXPIRED: GENERIC_CODE_MESSAGE,
  PROMOTION_REDEMPTION_LIMIT_REACHED: GENERIC_CODE_MESSAGE,
  PROMOTION_USER_LIMIT_REACHED: GENERIC_CODE_MESSAGE,
  // Safe to be specific here: only reachable for a code this same user already redeemed, not
  // useful for probing whether a code exists in general.
  PROMOTION_ALREADY_REDEEMED: "Ya usaste este código.",
  PROMOTION_NOT_STACKABLE: "Ya tenés un acceso promocional activo.",
  PROMOTION_ALREADY_ACTIVE: "Ya tenés un acceso promocional activo.",
  PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION: "Ya tenés una suscripción Pro activa.",
  PROMOTION_REDEMPTION_RATE_LIMITED: "Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.",
  // Admin-surface codes — unreachable from the user-facing redemption flow, kept generic.
  PROMOTION_NOT_FOUND: GENERIC_CODE_MESSAGE,
  PROMOTION_CODE_ALREADY_EXISTS: "Ya existe un código con ese nombre.",
  PROMOTION_GRANT_NOT_FOUND: "No encontramos ese acceso promocional.",
};

export function mapPromotionActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isPromotionError(error)) return { code: error.code, message: promotionMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
