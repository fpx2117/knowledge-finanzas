import { createDebtSummaryQueries, createPromotionRepository, createUpcomingObligationQueries, db } from "@know-finanzas/db";
import { createEvaluateFinancialAlerts } from "@/features/notifications/services/evaluate-financial-alerts";
import { notifyUser } from "./notify";

export const evaluateFinancialAlerts = createEvaluateFinancialAlerts({
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
  promotions: createPromotionRepository(db),
  notify: notifyUser,
});
