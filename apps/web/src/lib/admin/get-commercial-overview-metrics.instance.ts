import { createAdminOverviewRepository, db } from "@know-finanzas/db";
import { createGetCommercialOverviewMetrics } from "@/features/admin/overview/services/get-commercial-overview-metrics";

export const getCommercialOverviewMetrics = createGetCommercialOverviewMetrics({ repository: createAdminOverviewRepository(db) });
