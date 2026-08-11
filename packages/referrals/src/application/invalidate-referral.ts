import { ReferralError } from "../errors";
import type { ReferralAttributionRecord } from "../domain/types";

export type InvalidateReferralActor = { userId: string; isAdmin: boolean };

export type InvalidateReferralRepository = {
  findAttributionById(attributionId: string): Promise<ReferralAttributionRecord | undefined>;
  markInvalidated(input: { attributionId: string; invalidatedBy: string; invalidationReason: string; invalidatedAt: Date }): Promise<ReferralAttributionRecord>;
};

export function createInvalidateReferral(dependencies: { repository: InvalidateReferralRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return async function invalidateReferral(input: {
    attributionId: string;
    actor: InvalidateReferralActor;
    reason: string;
  }): Promise<ReferralAttributionRecord> {
    if (!input.actor.isAdmin) throw new ReferralError("REFERRAL_ATTRIBUTION_NOT_FOUND");
    if (!input.reason.trim()) throw new ReferralError("REFERRAL_REASON_REQUIRED");

    const attribution = await dependencies.repository.findAttributionById(input.attributionId);
    if (!attribution) throw new ReferralError("REFERRAL_ATTRIBUTION_NOT_FOUND");
    if (attribution.status === "INVALIDATED") return attribution;

    return dependencies.repository.markInvalidated({
      attributionId: attribution.id,
      invalidatedBy: input.actor.userId,
      invalidationReason: input.reason.trim(),
      invalidatedAt: now(),
    });
  };
}
