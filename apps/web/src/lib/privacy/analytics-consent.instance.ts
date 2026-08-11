import { createAnalyticsConsentRepository, db } from "@know-finanzas/db";
import { createGetAnalyticsConsent, createUpdateAnalyticsConsent, type AnalyticsConsentRepository } from "@know-finanzas/privacy";

export const CURRENT_POLICY_VERSION = "privacy-policy:v1";

// Same text-vs-literal-union cast rationale as statistical-profile.instance.ts. Pages read the
// untyped `analyticsConsentRepository` directly when they need its extra methods (e.g.
// listForUser) that aren't part of the narrower domain-service port.
export const analyticsConsentRepository = createAnalyticsConsentRepository(db);

const repository = analyticsConsentRepository as unknown as AnalyticsConsentRepository;

export const updateAnalyticsConsent = createUpdateAnalyticsConsent({ repository });
export const getAnalyticsConsent = createGetAnalyticsConsent({ repository });
