import type { AnalyticsConsentRecord, ConsentPurpose, ConsentStatus } from "./types";

export type AnalyticsConsentRepository = {
  findCurrentForUser(userId: string, purpose: ConsentPurpose): Promise<AnalyticsConsentRecord | undefined>;
  // Runs atomically: upserts the one current (user, purpose) row AND appends an
  // analytics_consent_history row in the same transaction — the history table is append-only,
  // never updated or deleted (Domain Rule, mirrors audit_log's contract).
  upsertAndRecordHistory(input: { userId: string; purpose: ConsentPurpose; status: ConsentStatus; policyVersion: string; occurredAt: Date }): Promise<AnalyticsConsentRecord>;
};

export function createUpdateAnalyticsConsent(dependencies: { repository: AnalyticsConsentRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function updateAnalyticsConsent(input: {
    userId: string;
    purpose: ConsentPurpose;
    action: "GRANT" | "WITHDRAW";
    policyVersion: string;
  }): Promise<AnalyticsConsentRecord> {
    const status: ConsentStatus = input.action === "GRANT" ? "GRANTED" : "WITHDRAWN";
    return dependencies.repository.upsertAndRecordHistory({
      userId: input.userId,
      purpose: input.purpose,
      status,
      policyVersion: input.policyVersion,
      occurredAt: now(),
    });
  };
}

export function createGetAnalyticsConsent(dependencies: { repository: AnalyticsConsentRepository }) {
  // Absence of a row is treated identically to WITHDRAWN — consent is opt-in only, never assumed.
  return async function getAnalyticsConsent(userId: string, purpose: ConsentPurpose): Promise<ConsentStatus> {
    const current = await dependencies.repository.findCurrentForUser(userId, purpose);
    return current?.status ?? "WITHDRAWN";
  };
}
