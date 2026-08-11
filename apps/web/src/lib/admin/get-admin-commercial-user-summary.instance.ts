import {
  createAICreditRepository,
  createBillingPaymentRepository,
  createBillingRefundRepository,
  createBillingSubscriptionRepository,
  createNotificationDeliveryRepository,
  createPromotionRepository,
  createUserRepository,
  db,
} from "@know-finanzas/db";
import { env } from "@know-finanzas/config";
import { createGetAdminCommercialUserSummary } from "@/features/admin/users/services/get-admin-commercial-user-summary";

export const getAdminCommercialUserSummary = createGetAdminCommercialUserSummary({
  users: createUserRepository(db),
  subscriptions: createBillingSubscriptionRepository(db),
  payments: createBillingPaymentRepository(db),
  refunds: createBillingRefundRepository(db),
  promotions: createPromotionRepository(db),
  aiCredits: createAICreditRepository(db),
  whatsappUsage: createNotificationDeliveryRepository(db),
  graceDays: env.BILLING_GRACE_PERIOD_DAYS,
});
