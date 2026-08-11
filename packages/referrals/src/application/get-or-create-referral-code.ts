import { generateReferralCode } from "../domain/generate-code";
import type { ReferralCodeRecord } from "../domain/types";

export type GetOrCreateReferralCodeRepository = {
  findActiveCodeByOwner(ownerUserId: string): Promise<ReferralCodeRecord | undefined>;
  createCode(input: { ownerUserId: string; code: string }): Promise<ReferralCodeRecord>;
};

export function createGetOrCreateReferralCode(dependencies: {
  repository: GetOrCreateReferralCodeRepository;
  generateCode?: () => string;
}) {
  const generateCode = dependencies.generateCode ?? generateReferralCode;

  return async function getOrCreateReferralCode(input: { ownerUserId: string }): Promise<ReferralCodeRecord> {
    const existing = await dependencies.repository.findActiveCodeByOwner(input.ownerUserId);
    if (existing) return existing;

    return dependencies.repository.createCode({ ownerUserId: input.ownerUserId, code: generateCode() });
  };
}
