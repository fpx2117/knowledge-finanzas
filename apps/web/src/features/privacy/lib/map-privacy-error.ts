import { isPrivacyError, type PrivacyErrorCode } from "@know-finanzas/privacy";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

const privacyMessages: Record<PrivacyErrorCode, string> = {
  PRIVACY_INVALID_STATISTICAL_PROFILE_FIELD: "Ese valor no es válido. Probá de nuevo.",
  PRIVACY_INVALID_CONSENT_PURPOSE: "No pudimos procesar esa solicitud de consentimiento.",
};

export function mapPrivacyActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isPrivacyError(error)) return { code: error.code, message: privacyMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
