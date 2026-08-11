import { PromotionError } from "../errors";
import { normalizePromotionCode } from "../domain/normalize-code";
import type {
  PromotionalAccessGrantRecord,
  PromotionCodeSnapshot,
  PromotionDurationUnit,
  PromotionStackingPolicy,
} from "../domain/types";

export type CreatePromotionCodeInput = {
  code: string;
  name: string;
  description?: string | null;
  durationValue: number;
  durationUnit?: PromotionDurationUnit;
  redemptionStartsAt?: Date | null;
  redemptionEndsAt?: Date | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  stackingPolicy?: PromotionStackingPolicy;
  aiCreditsPerPeriod?: number;
  whatsappMessagesPerPeriod?: number;
  createdBy: string;
};

export type UpdatePromotionCodeInput = {
  name?: string;
  description?: string | null;
  redemptionStartsAt?: Date | null;
  redemptionEndsAt?: Date | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number;
  // durationValue/aiCreditsPerPeriod/whatsappMessagesPerPeriod are deliberately NOT editable here:
  // task's Financial Invariant "editing a promotion code's duration/allowance never retroactively
  // changes already-issued grants" is enforced by never letting them change on an existing code at
  // all once it can have redemptions — create a new code instead.
};

export type PromotionServiceRepository = {
  findByNormalizedCode(normalizedCode: string): Promise<PromotionCodeSnapshot | undefined>;
  findById(codeId: string): Promise<PromotionCodeSnapshot | undefined>;
  listAll(): Promise<PromotionCodeSnapshot[]>;
  create(input: {
    code: string;
    normalizedCode: string;
    name: string;
    description: string | null;
    durationValue: number;
    durationUnit: PromotionDurationUnit;
    redemptionStartsAt: Date | null;
    redemptionEndsAt: Date | null;
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number;
    stackingPolicy: PromotionStackingPolicy;
    aiCreditsPerPeriod: number;
    whatsappMessagesPerPeriod: number;
    createdBy: string;
  }): Promise<PromotionCodeSnapshot>;
  update(codeId: string, input: UpdatePromotionCodeInput): Promise<PromotionCodeSnapshot>;
  setStatus(codeId: string, status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "REVOKED"): Promise<PromotionCodeSnapshot>;
};

export type PromotionGrantRepository = {
  findGrantById(grantId: string): Promise<PromotionalAccessGrantRecord | undefined>;
  revokeGrant(grantId: string, input: { revokedBy: string; revocationReason: string | null; revokedAt: Date }): Promise<PromotionalAccessGrantRecord | undefined>;
  extendGrant(grantId: string, input: { endsAt: Date }): Promise<PromotionalAccessGrantRecord | undefined>;
};

export function createPromotionService(dependencies: {
  codes: PromotionServiceRepository;
  grants: PromotionGrantRepository;
}) {
  async function createCode(input: CreatePromotionCodeInput): Promise<PromotionCodeSnapshot> {
    const normalizedCode = normalizePromotionCode(input.code);
    const existing = await dependencies.codes.findByNormalizedCode(normalizedCode);
    if (existing) throw new PromotionError("PROMOTION_CODE_ALREADY_EXISTS", { field: "code" });

    return dependencies.codes.create({
      code: input.code.trim(),
      normalizedCode,
      name: input.name,
      description: input.description ?? null,
      durationValue: input.durationValue,
      durationUnit: input.durationUnit ?? "DAYS",
      redemptionStartsAt: input.redemptionStartsAt ?? null,
      redemptionEndsAt: input.redemptionEndsAt ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? 1,
      stackingPolicy: input.stackingPolicy ?? "NOT_STACKABLE",
      aiCreditsPerPeriod: input.aiCreditsPerPeriod ?? 0,
      whatsappMessagesPerPeriod: input.whatsappMessagesPerPeriod ?? 0,
      createdBy: input.createdBy,
    });
  }

  async function updateCode(codeId: string, input: UpdatePromotionCodeInput): Promise<PromotionCodeSnapshot> {
    const existing = await dependencies.codes.findById(codeId);
    if (!existing) throw new PromotionError("PROMOTION_NOT_FOUND");
    return dependencies.codes.update(codeId, input);
  }

  async function requireCode(codeId: string): Promise<PromotionCodeSnapshot> {
    const code = await dependencies.codes.findById(codeId);
    if (!code) throw new PromotionError("PROMOTION_NOT_FOUND");
    return code;
  }

  async function activateCode(codeId: string): Promise<PromotionCodeSnapshot> {
    await requireCode(codeId);
    return dependencies.codes.setStatus(codeId, "ACTIVE");
  }

  async function pauseCode(codeId: string): Promise<PromotionCodeSnapshot> {
    await requireCode(codeId);
    return dependencies.codes.setStatus(codeId, "PAUSED");
  }

  async function revokeCode(codeId: string): Promise<PromotionCodeSnapshot> {
    await requireCode(codeId);
    return dependencies.codes.setStatus(codeId, "REVOKED");
  }

  async function getPromotion(codeId: string): Promise<PromotionCodeSnapshot> {
    return requireCode(codeId);
  }

  function listPromotions(): Promise<PromotionCodeSnapshot[]> {
    return dependencies.codes.listAll();
  }

  async function revokeGrant(grantId: string, input: { revokedBy: string; revocationReason: string | null; now?: Date }): Promise<PromotionalAccessGrantRecord> {
    const existing = await dependencies.grants.findGrantById(grantId);
    if (!existing) throw new PromotionError("PROMOTION_GRANT_NOT_FOUND");
    const revoked = await dependencies.grants.revokeGrant(grantId, { revokedBy: input.revokedBy, revocationReason: input.revocationReason, revokedAt: input.now ?? new Date() });
    if (!revoked) throw new PromotionError("PROMOTION_GRANT_NOT_FOUND");
    return revoked;
  }

  async function extendGrant(grantId: string, input: { endsAt: Date }): Promise<PromotionalAccessGrantRecord> {
    const existing = await dependencies.grants.findGrantById(grantId);
    if (!existing) throw new PromotionError("PROMOTION_GRANT_NOT_FOUND");
    const extended = await dependencies.grants.extendGrant(grantId, { endsAt: input.endsAt });
    if (!extended) throw new PromotionError("PROMOTION_GRANT_NOT_FOUND");
    return extended;
  }

  return { createCode, updateCode, activateCode, pauseCode, revokeCode, getPromotion, listPromotions, revokeGrant, extendGrant };
}
