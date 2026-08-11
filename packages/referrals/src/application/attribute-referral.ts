import { ReferralError } from "../errors";
import { isWithinAttributionWindow, DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS } from "../domain/attribution-window";
import type { ReferralAttributionRecord, ReferralCodeRecord } from "../domain/types";

export type AttributeReferralRepository = {
  findActiveCodeByCode(code: string): Promise<ReferralCodeRecord | undefined>;
  // Frontend can only submit a `code` (task's Security Requirements) — the repository resolves
  // referrerUserId/referredUserId itself, never taking them as raw caller-supplied input here.
  findAttributionByReferredUser(referredUserId: string): Promise<ReferralAttributionRecord | undefined>;
  // Runs inside one transaction: re-checks for an existing attribution for referredUserId (unique
  // constraint backstop) and inserts the ATTRIBUTED row atomically.
  createAttribution(input: {
    referralCodeId: string;
    referrerUserId: string;
    referredUserId: string;
  }): Promise<ReferralAttributionRecord>;
};

export function createAttributeReferral(dependencies: {
  repository: AttributeReferralRepository;
  windowHours?: number;
  now?: () => Date;
}) {
  const now = dependencies.now ?? (() => new Date());
  const windowHours = dependencies.windowHours ?? DEFAULT_REFERRAL_ATTRIBUTION_WINDOW_HOURS;

  return async function attributeReferral(input: {
    rawCode: string;
    referredUserId: string;
    referredUserCreatedAt: Date;
  }): Promise<ReferralAttributionRecord> {
    const existingAttribution = await dependencies.repository.findAttributionByReferredUser(input.referredUserId);
    if (existingAttribution) throw new ReferralError("REFERRAL_ALREADY_ATTRIBUTED");

    if (
      !isWithinAttributionWindow({
        referredUserCreatedAt: input.referredUserCreatedAt,
        submittedAt: now(),
        windowHours,
      })
    ) {
      throw new ReferralError("REFERRAL_ATTRIBUTION_WINDOW_EXPIRED");
    }

    const code = await dependencies.repository.findActiveCodeByCode(input.rawCode.trim().toUpperCase());
    if (!code) throw new ReferralError("REFERRAL_CODE_NOT_FOUND");
    if (code.status !== "ACTIVE") throw new ReferralError("REFERRAL_CODE_REVOKED");
    if (code.ownerUserId === input.referredUserId) throw new ReferralError("REFERRAL_SELF_REFERRAL");

    return dependencies.repository.createAttribution({
      referralCodeId: code.id,
      referrerUserId: code.ownerUserId,
      referredUserId: input.referredUserId,
    });
  };
}
