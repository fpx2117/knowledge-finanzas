// Consent != Terms Acceptance (Domain Rule) — this is a separate, explicit, revocable action per
// purpose, never bundled into signup/ToS. Default is always "no consent" (absence of a row, or
// status WITHDRAWN) — nothing is ever pre-checked.
export const CONSENT_PURPOSES = ["PRODUCT_ANALYTICS", "EXTERNAL_AGGREGATED_STATISTICS"] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const CONSENT_STATUSES = ["GRANTED", "WITHDRAWN"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export type AnalyticsConsentRecord = {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policyVersion: string;
  grantedAt: Date | null;
  withdrawnAt: Date | null;
  createdAt: Date;
};

export type AnalyticsConsentHistoryEntry = {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  action: ConsentStatus;
  policyVersion: string;
  occurredAt: Date;
};
