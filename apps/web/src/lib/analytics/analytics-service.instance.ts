import { createAnalyticsEventRepository, db } from "@know-finanzas/db";
import { createAnalyticsService, isInternalAccountEmail } from "@know-finanzas/analytics";
import { env } from "@know-finanzas/config";

const repository = createAnalyticsEventRepository(db);

export const analyticsService = createAnalyticsService({
  provider: repository,
  environment: env.NODE_ENV,
});

const internalEmailDomains = env.ANALYTICS_INTERNAL_EMAIL_DOMAINS?.split(",").map((domain) => domain.trim()).filter(Boolean) ?? [];

export function isInternalAccount(email: string): boolean {
  return isInternalAccountEmail(email, internalEmailDomains);
}

export { repository as analyticsEventRepository };
