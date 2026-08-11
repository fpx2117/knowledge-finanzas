import { createAnalyticsEventRepository, db } from "@know-finanzas/db";
import { createGetProductFunnelMetrics } from "@/features/admin/overview/services/get-product-funnel-metrics";

export const getProductFunnelMetrics = createGetProductFunnelMetrics({ repository: createAnalyticsEventRepository(db) });
