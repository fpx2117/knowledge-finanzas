import { createDebtSummaryQueries, createUpcomingObligationQueries } from "@know-finanzas/db";
import { createPromotionRepository, db } from "@know-finanzas/db";

import { notifyUser } from "@/lib/notifications/notify";
import { createEvaluateFinancialAlerts } from "./evaluate-financial-alerts";

export const evaluateFinancialAlerts = createEvaluateFinancialAlerts({
  debts: createDebtSummaryQueries(db),
  scheduled: createUpcomingObligationQueries(db),
  promotions: createPromotionRepository(db),
  notify: notifyUser,
});
