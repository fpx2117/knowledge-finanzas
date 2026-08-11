import { db } from "@know-finanzas/db";
import { env } from "@know-finanzas/config";
import { createGenerateCohortAggregate } from "@/features/privacy/services/generate-cohort-aggregate";

const internalEmailDomains = env.ANALYTICS_INTERNAL_EMAIL_DOMAINS?.split(",").map((domain) => domain.trim()).filter(Boolean) ?? [];

export const generateCohortAggregate = createGenerateCohortAggregate({ database: db, internalEmailDomains });
