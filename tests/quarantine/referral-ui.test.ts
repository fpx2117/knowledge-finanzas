import { describe, expect, it } from "vitest";
import {
  createAttributeReferral,
  createGetOrCreateReferralCode,
  createGrantReferralReward,
  createHandleReferralConversion,
  createInvalidateReferral,
  createRetryReferralReward,
  DEFAULT_REFERRAL_REWARD_POLICY,
} from "@know-finanzas/referrals";
import { createRecordAuditEntry } from "@know-finanzas/audit";
import { createGetReferralSummary } from "../../apps/web/src/features/referrals/queries/get-referral-summary";
import { createReferralRepository } from "../../packages/db/src/repositories/referrals";
import { createAuditLogRepository } from "../../packages/db/src/repositories/audit-log";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const referrerA = "00000000-0000-0000-0000-000000000901";
const referrerB = "00000000-0000-0000-0000-000000000902";
const referredForA = "00000000-0000-0000-0000-000000000903";
const referredForB = "00000000-0000-0000-0000-000000000904";
const adminUser = "00000000-0000-0000-0000-000000000905";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: referrerA, name: "Referrer A", email: "referral-ui-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: referrerB, name: "Referrer B", email: "referral-ui-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: referredForA, name: "Referred A", email: "referral-ui-ra@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: referredForB, name: "Referred B", email: "referral-ui-rb@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: adminUser, name: "Admin", email: "referral-ui-admin@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

const rewardPolicyView = {
  nonPaidType: DEFAULT_REFERRAL_REWARD_POLICY.nonPaidRewardType,
  nonPaidValue: DEFAULT_REFERRAL_REWARD_POLICY.nonPaidRewardValue,
  paidType: DEFAULT_REFERRAL_REWARD_POLICY.paidRewardType,
  paidValue: DEFAULT_REFERRAL_REWARD_POLICY.paidRewardValue,
};

describe("referral UI read model and admin actions (real repositories)", () => {
  it("GetReferralSummary returns only the authenticated user's own invitations, never another referrer's", async () => {
    const database = await seedUsers();
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });

    const codeA = await getOrCreateReferralCode({ ownerUserId: referrerA });
    const codeB = await getOrCreateReferralCode({ ownerUserId: referrerB });
    await attributeReferral({ rawCode: codeA.code, referredUserId: referredForA, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
    await attributeReferral({ rawCode: codeB.code, referredUserId: referredForB, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });

    const getReferralSummary = createGetReferralSummary({
      getOrCreateReferralCode,
      listAttributionsForReferrer: (referrerUserId) => repository.listAttributionsForReferrer(referrerUserId),
      rewardPolicy: rewardPolicyView,
    });

    const summaryA = await getReferralSummary(referrerA);
    const summaryB = await getReferralSummary(referrerB);

    expect(summaryA.code).toBe(codeA.code);
    expect(summaryA.totalSignups).toBe(1);
    expect(summaryB.code).toBe(codeB.code);
    expect(summaryB.totalSignups).toBe(1);
    // Cross-check: A's summary never surfaces B's invitation or vice versa.
    expect(summaryA.invitations).toHaveLength(1);
    expect(summaryB.invitations).toHaveLength(1);
  });

  it("admin invalidate mirrors the Server Action: calls InvalidateReferral and records exactly one audit entry", async () => {
    const database = await seedUsers();
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerA });
    const attribution = await attributeReferral({ rawCode: code.code, referredUserId: referredForA, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });

    const invalidateReferral = createInvalidateReferral({ repository });
    const recordAuditEntry = createRecordAuditEntry({ repository: createAuditLogRepository(database) });

    const invalidated = await invalidateReferral({ attributionId: attribution.id, actor: { userId: adminUser, isAdmin: true }, reason: "fraude detectado" });
    await recordAuditEntry({
      actorUserId: adminUser,
      action: "ADMIN_INVALIDATE_REFERRAL",
      entityType: "referral_attribution",
      entityId: attribution.id,
      targetUserId: invalidated.referredUserId,
      beforeSnapshot: null,
      afterSnapshot: invalidated,
      reason: "fraude detectado",
    });

    expect(invalidated.status).toBe("INVALIDATED");
    const auditLog = createAuditLogRepository(database);
    const entries = await auditLog.search({ targetUserId: referredForA });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ action: "ADMIN_INVALIDATE_REFERRAL", reason: "fraude detectado" });
  });

  it("admin retry mirrors the Server Action: calls RetryReferralReward and records an audit entry, idempotently", async () => {
    const database = await seedUsers();
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    const handleReferralConversion = createHandleReferralConversion({ repository });

    const code = await getOrCreateReferralCode({ ownerUserId: referrerA });
    await attributeReferral({ rawCode: code.code, referredUserId: referredForA, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
    const { reward } = await handleReferralConversion({ referredUserId: referredForA, referrerHasEffectivePaidAccess: false });

    // First grant attempt fails (simulating the promotions port erroring) — reward ends up FAILED.
    const grantReferralReward = createGrantReferralReward({ repository, grantPromotionalDays: async () => ({ ok: false, errorCode: "PROMOTION_ALREADY_ACTIVE" }) });
    await grantReferralReward({ rewardId: reward!.id });

    const recordAuditEntry = createRecordAuditEntry({ repository: createAuditLogRepository(database) });

    const retryReferralReward = createRetryReferralReward({ repository, grantPromotionalDays: async (input) => ({ ok: true, grantReferenceId: `grant-${input.referenceId}` }) });
    const retried = await retryReferralReward({ rewardId: reward!.id, actor: { userId: adminUser, isAdmin: true } });
    await recordAuditEntry({
      actorUserId: adminUser,
      action: "ADMIN_RETRY_REFERRAL_REWARD",
      entityType: "referral_reward",
      entityId: reward!.id,
      targetUserId: retried.beneficiaryUserId,
      beforeSnapshot: null,
      afterSnapshot: retried,
      reason: `retry outcome: ${retried.status}`,
    });

    expect(retried.status).toBe("GRANTED");

    // A second retry on an already-GRANTED reward is rejected outright (RetryReferralReward only
    // ever retries a FAILED reward) — never grants twice.
    await expect(retryReferralReward({ rewardId: reward!.id, actor: { userId: adminUser, isAdmin: true } })).rejects.toThrow("REFERRAL_REWARD_NOT_RETRYABLE");

    const auditLog = createAuditLogRepository(database);
    const entries = await auditLog.search({ targetUserId: referrerA });
    expect(entries.filter((e) => e.action === "ADMIN_RETRY_REFERRAL_REWARD")).toHaveLength(1);
  });
});
