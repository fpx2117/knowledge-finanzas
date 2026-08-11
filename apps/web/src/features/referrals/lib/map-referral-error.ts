import { isReferralError, type ReferralErrorCode } from "@know-finanzas/referrals";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";

const referralMessages: Record<ReferralErrorCode, string> = {
  REFERRAL_CODE_NOT_FOUND: "Ese código no es válido.",
  REFERRAL_CODE_REVOKED: "Ese código ya no está disponible.",
  REFERRAL_SELF_REFERRAL: "No podés usar tu propio código de referidos.",
  REFERRAL_ATTRIBUTION_WINDOW_EXPIRED: "Ese código ya no puede aplicarse a esta cuenta.",
  REFERRAL_ALREADY_ATTRIBUTED: "Esta cuenta ya tiene un código de referidos asociado.",
  REFERRAL_ATTRIBUTION_NOT_FOUND: "No encontramos esa referencia.",
  REFERRAL_REWARD_CAP_REACHED: "Se alcanzó el límite de recompensas para este período.",
  REFERRAL_REWARD_NOT_FOUND: "No encontramos esa recompensa.",
  REFERRAL_REWARD_NOT_RETRYABLE: "Esa recompensa no se puede reintentar.",
  REFERRAL_REASON_REQUIRED: "Ingresá un motivo para continuar.",
};

export function mapReferralActionErrorToUi(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isReferralError(error)) return { code: error.code, message: referralMessages[error.code] };
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
