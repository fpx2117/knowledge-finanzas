import { isBillingError } from "@know-finanzas/billing";
import { isNotificationError } from "@know-finanzas/notifications";
import { isPromotionError } from "@know-finanzas/promotions";
import { isReferralError } from "@know-finanzas/referrals";
import { isApplicationError } from "@know-finanzas/shared";

import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { mapBillingActionErrorToUi } from "@/features/billing/lib/map-billing-error";
import { mapNotificationActionErrorToUi } from "@/features/notifications/lib/map-notification-error";
import { mapPromotionActionErrorToUi } from "@/features/promotions/lib/map-promotion-error";
import { mapReferralActionErrorToUi } from "@/features/referrals/lib/map-referral-error";

// Every admin Server Action in TASK-060/TASK-056 delegates to a domain service from a different
// package (billing/promotions/notifications/referrals/shared) — this composes all of their
// existing error mappers rather than duplicating message copy here.
export function mapAdminActionError(error: unknown): { code: string; message: string } {
  if (isApplicationError(error)) return mapErrorToUi(error);
  if (isBillingError(error)) return mapBillingActionErrorToUi(error);
  if (isNotificationError(error)) return mapNotificationActionErrorToUi(error);
  if (isPromotionError(error)) return mapPromotionActionErrorToUi(error);
  if (isReferralError(error)) return mapReferralActionErrorToUi(error);
  return { code: "INTERNAL_ERROR", message: "No pudimos completar la operación. Intentá nuevamente." };
}
