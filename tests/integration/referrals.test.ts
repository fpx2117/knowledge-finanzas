import { describe, expect, it } from "vitest";
import {
  createAttributeReferral,
  createGetOrCreateReferralCode,
  createGrantReferralReward,
  createHandleReferralConversion,
  createInvalidateReferral,
  createRetryReferralReward,
  isReferralError,
} from "@know-finanzas/referrals";
import { createReferralRepository } from "../../packages/db/src/repositories/referrals";
import { referralRewards, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const referrerId = "00000000-0000-0000-0000-000000000801";
const referredId = "00000000-0000-0000-0000-000000000802";
const otherReferredId = "00000000-0000-0000-0000-000000000803";
const adminId = "00000000-0000-0000-0000-000000000804";

async function seedUsers(extra: string[] = []) {
  const database = getTestDatabase().db;
  await database.insert(users).values(
    [referrerId, referredId, otherReferredId, adminId, ...extra].map((id, i) => ({
      id,
      name: `Referral User ${i}`,
      email: `referral-user-${id}@example.test`,
      timezone: "UTC",
      baseCurrency: "ARS",
    })),
  );
  return database;
}

describe("referrals (real repository)", () => {
  it("creates a referral code for the owner and reuses it on subsequent calls", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });

    const first = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const second = await getOrCreateReferralCode({ ownerUserId: referrerId });

    expect(second.id).toBe(first.id);
    expect(second.code).toBe(first.code);
  });

  it("attributes a referral submitted within the window and rejects self-referral", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });

    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    const attribution = await attributeReferral({ rawCode: code.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
    expect(attribution).toMatchObject({ referrerUserId: referrerId, referredUserId: referredId, status: "ATTRIBUTED" });

    // Attempting to attribute to the code's own owner is rejected outright.
    await expect(
      attributeReferral({ rawCode: code.code, referredUserId: referrerId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") }),
    ).rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_SELF_REFERRAL");
  });

  it("enforces one attribution per referred user, ever — a second attempt is rejected even for a different code", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const codeA = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const codeB = await getOrCreateReferralCode({ ownerUserId: otherReferredId });

    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    await attributeReferral({ rawCode: codeA.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });

    await expect(
      attributeReferral({ rawCode: codeB.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") }),
    ).rejects.toSatisfy((error) => isReferralError(error) && error.code === "REFERRAL_ALREADY_ATTRIBUTED");
  });

  it("converts on first paid activation and is idempotent for duplicate qualification events (one conversion, one reward)", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    await attributeReferral({ rawCode: code.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });

    const handleReferralConversion = createHandleReferralConversion({ repository });

    const first = await handleReferralConversion({ referredUserId: referredId, referrerHasEffectivePaidAccess: false, occurredAt: new Date("2026-06-20T00:00:00Z") });
    expect(first.attribution.status).toBe("CONVERTED");
    expect(first.reward).toMatchObject({ type: "PROMOTIONAL_PRO_DAYS", value: 30, status: "PENDING" });

    // Simulates a duplicate PaidProActivated event (e.g. a retried webhook) — must not create a
    // second CONVERTED transition or a second reward row.
    const second = await handleReferralConversion({ referredUserId: referredId, referrerHasEffectivePaidAccess: false, occurredAt: new Date("2026-06-20T00:05:00Z") });
    expect(second.reward?.id).toBe(first.reward?.id);

    const allRewards = await database.select().from(referralRewards);
    expect(allRewards).toHaveLength(1);
  });

  it("grants the reward via the injected port and marks it GRANTED", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    await attributeReferral({ rawCode: code.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
    const handleReferralConversion = createHandleReferralConversion({ repository });
    const { reward } = await handleReferralConversion({ referredUserId: referredId, referrerHasEffectivePaidAccess: false });

    const grantReferralReward = createGrantReferralReward({
      repository,
      grantPromotionalDays: async (input) => ({ ok: true, grantReferenceId: `promo-grant-${input.referenceId}` }),
    });
    const granted = await grantReferralReward({ rewardId: reward!.id });
    expect(granted).toMatchObject({ status: "GRANTED", grantReferenceId: `promo-grant-${reward!.id}` });
  });

  it("a failed reward grant is retryable by an admin without rolling back the conversion", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    await attributeReferral({ rawCode: code.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
    const handleReferralConversion = createHandleReferralConversion({ repository });
    const { attribution, reward } = await handleReferralConversion({ referredUserId: referredId, referrerHasEffectivePaidAccess: false });

    const grantReferralReward = createGrantReferralReward({
      repository,
      grantPromotionalDays: async () => ({ ok: false, errorCode: "PROMOTION_ALREADY_ACTIVE" }),
    });
    const failed = await grantReferralReward({ rewardId: reward!.id });
    expect(failed.status).toBe("FAILED");

    // The attribution's CONVERTED status is untouched by the reward failure.
    const stillConverted = await repository.findAttributionByReferredUser(referredId);
    expect(stillConverted?.status).toBe("CONVERTED");
    expect(stillConverted?.id).toBe(attribution.id);

    const retryReferralReward = createRetryReferralReward({
      repository,
      grantPromotionalDays: async (input) => ({ ok: true, grantReferenceId: `retried-${input.referenceId}` }),
    });
    const retried = await retryReferralReward({ rewardId: reward!.id, actor: { userId: adminId, isAdmin: true } });
    expect(retried.status).toBe("GRANTED");
  });

  it("stops granting rewards to the same beneficiary once the per-period cap is reached", async () => {
    const extraReferred = ["00000000-0000-0000-0000-000000000811", "00000000-0000-0000-0000-000000000812", "00000000-0000-0000-0000-000000000813", "00000000-0000-0000-0000-000000000814"];
    await seedUsers(extraReferred);
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    const handleReferralConversion = createHandleReferralConversion({ repository });
    const grantReferralReward = createGrantReferralReward({
      repository,
      grantPromotionalDays: async (input) => ({ ok: true, grantReferenceId: `grant-${input.referenceId}` }),
    });

    const rewards = [];
    for (const [index, refUserId] of [referredId, ...extraReferred].slice(0, 4).entries()) {
      await attributeReferral({ rawCode: code.code, referredUserId: refUserId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });
      const { reward } = await handleReferralConversion({
        referredUserId: refUserId,
        referrerHasEffectivePaidAccess: false,
        occurredAt: new Date(`2026-06-${20 + index}T00:00:00Z`),
      });
      if (reward) {
        await grantReferralReward({ rewardId: reward.id });
        rewards.push(reward);
      } else {
        rewards.push(null);
      }
    }

    // Default policy caps at 3 rewards per 30-day rolling period — the 4th conversion for the
    // same beneficiary (referrer) yields no reward at all.
    expect(rewards.filter(Boolean)).toHaveLength(3);
    expect(rewards[3]).toBeNull();
  });

  it("an admin can invalidate an attribution with a reason, and it stays invalidated", async () => {
    await seedUsers();
    const database = getTestDatabase().db;
    const repository = createReferralRepository(database);
    const getOrCreateReferralCode = createGetOrCreateReferralCode({ repository });
    const code = await getOrCreateReferralCode({ ownerUserId: referrerId });
    const attributeReferral = createAttributeReferral({ repository, now: () => new Date("2026-06-15T01:00:00Z") });
    const attribution = await attributeReferral({ rawCode: code.code, referredUserId: referredId, referredUserCreatedAt: new Date("2026-06-15T00:00:00Z") });

    const invalidateReferral = createInvalidateReferral({ repository });
    const invalidated = await invalidateReferral({ attributionId: attribution.id, actor: { userId: adminId, isAdmin: true }, reason: "fraud detected" });
    expect(invalidated).toMatchObject({ status: "INVALIDATED", invalidatedBy: adminId, invalidationReason: "fraud detected" });

    const handleReferralConversion = createHandleReferralConversion({ repository });
    const result = await handleReferralConversion({ referredUserId: referredId, referrerHasEffectivePaidAccess: false });
    expect(result.attribution.status).toBe("INVALIDATED");
    expect(result.reward).toBeNull();
  });
});
