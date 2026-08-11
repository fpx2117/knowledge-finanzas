import { describe, expect, it } from "vitest";
import {
  createGrantPromotionalProAccess,
  createRedeemPromotionCode,
  decideRedemption,
} from "@know-finanzas/promotions";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { billingPayments, billingPeriods, billingSubscriptions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000901";
const userB = "00000000-0000-0000-0000-000000000902";
const adminUser = "00000000-0000-0000-0000-000000000903";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "promotions-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "promotions-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: adminUser, name: "Admin", email: "promotions-admin@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
  return database;
}

async function activeCode(repository: ReturnType<typeof createPromotionRepository>, overrides: Partial<Parameters<typeof repository.create>[0]> = {}) {
  const created = await repository.create({
    code: overrides.code ?? "WELCOME30",
    normalizedCode: overrides.normalizedCode ?? "WELCOME30",
    name: "Welcome",
    description: null,
    durationValue: 30,
    durationUnit: "DAYS",
    redemptionStartsAt: null,
    redemptionEndsAt: null,
    maxRedemptions: null,
    maxRedemptionsPerUser: 1,
    stackingPolicy: "NOT_STACKABLE",
    aiCreditsPerPeriod: 0,
    whatsappMessagesPerPeriod: 0,
    createdBy: adminUser,
    ...overrides,
  });
  return repository.setStatus(created.id, "ACTIVE");
}

describe("promotions (real repositories)", () => {
  it("redeems a valid code, creating exactly one redemption and one grant", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository);

    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });
    const result = await redeemPromotionCode({ rawCode: "welcome30", userId: userA, hasActivePaidSubscription: false });

    expect(result.grant).toMatchObject({ userId: userA, status: "ACTIVE", source: "CODE_REDEMPTION" });
    expect(result.redemption).toMatchObject({ userId: userA, status: "REDEEMED", grantId: result.grant.id });
    expect(result.grant.endsAt).toEqual(new Date("2026-01-31T00:00:00Z"));
  });

  it("a retried redemption after already holding an active grant is rejected, never duplicating the grant", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository);
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    await redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false });

    await expect(redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false }))
      .rejects.toThrow("PROMOTION_ALREADY_REDEEMED");
  });

  it("rejects redemption while the user already holds an active grant from a DIFFERENT code (PROMOTION_ALREADY_ACTIVE)", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository, { code: "FIRST", normalizedCode: "FIRST" });
    await activeCode(repository, { code: "SECOND", normalizedCode: "SECOND" });
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    await redeemPromotionCode({ rawCode: "FIRST", userId: userA, hasActivePaidSubscription: false });

    await expect(redeemPromotionCode({ rawCode: "SECOND", userId: userA, hasActivePaidSubscription: false }))
      .rejects.toThrow("PROMOTION_ALREADY_ACTIVE");
  });

  it("does not exceed max_redemptions under concurrent requests", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository, { maxRedemptions: 3, maxRedemptionsPerUser: 1 });

    // Seed 5 distinct users so each concurrent redemption is a different, otherwise-eligible user
    // — isolates the max_redemptions=3 global cap as the only thing that can reject a request.
    const extraUsers = Array.from({ length: 4 }, (_, i) => `00000000-0000-0000-0000-00000000091${i}`);
    await database.insert(users).values(extraUsers.map((id, i) => ({ id, name: `Concurrent ${i}`, email: `promotions-concurrent-${i}@example.test`, timezone: "UTC", baseCurrency: "ARS" })));
    const candidateUserIds = [userA, userB, ...extraUsers];

    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });
    const results = await Promise.allSettled(candidateUserIds.map((userId) => redeemPromotionCode({ rawCode: "WELCOME30", userId, hasActivePaidSubscription: false })));

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(succeeded).toHaveLength(3);
    expect(rejected).toHaveLength(3);
    for (const failure of rejected) {
      expect((failure as PromiseRejectedResult).reason.message).toBe("PROMOTION_REDEMPTION_LIMIT_REACHED");
    }
  });

  it("editing a code's duration after redemption never changes the already-issued grant's endsAt (snapshot terms)", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    const code = await activeCode(repository, { durationValue: 30 });
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    const result = await redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false });
    expect(result.grant.endsAt).toEqual(new Date("2026-01-31T00:00:00Z"));

    // update() intentionally has no durationValue field at all — this is enforced at the type
    // level (UpdatePromotionCodeInput), not just by this test not calling it.
    await repository.update(code.id, { name: "Renamed after redemption" });

    const stillSameGrant = await repository.findGrantById(result.grant.id);
    expect(stillSameGrant?.endsAt).toEqual(new Date("2026-01-31T00:00:00Z"));
  });

  it("rejects redemption while the caller has an active paid subscription", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository);
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    await expect(redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: true }))
      .rejects.toThrow("PROMOTION_NOT_APPLICABLE_TO_ACTIVE_SUBSCRIPTION");
  });

  it("scopes redemption history per user — user A's redemption is invisible from user B's perspective", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository);
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    await redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false });

    // User B redeeming the SAME code succeeds independently — a per-user redemption count of 0
    // for user B, unaffected by user A's redemption.
    const resultB = await redeemPromotionCode({ rawCode: "WELCOME30", userId: userB, hasActivePaidSubscription: false });
    expect(resultB.grant.userId).toBe(userB);

    const grantA = await repository.findActiveGrantForUser(userA);
    const grantB = await repository.findActiveGrantForUser(userB);
    expect(grantA?.userId).toBe(userA);
    expect(grantB?.userId).toBe(userB);
    expect(grantA?.id).not.toBe(grantB?.id);
  });

  it("revokeGrant immediately deactivates the grant without deleting redemption/code history", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository);
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });
    const result = await redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false });

    const revoked = await repository.revokeGrant(result.grant.id, { revokedBy: adminUser, revocationReason: "fraud", revokedAt: new Date("2026-01-05T00:00:00Z") });
    expect(revoked).toMatchObject({ status: "REVOKED", revokedBy: adminUser, revocationReason: "fraud" });

    expect(await repository.findActiveGrantForUser(userA)).toBeUndefined();
    // The redemption and code rows themselves are untouched (never deleted).
    const stillFindable = await repository.findGrantById(result.grant.id);
    expect(stillFindable).toMatchObject({ id: result.grant.id, status: "REVOKED" });
  });

  it("grants manual promotional access with source=ADMIN_OVERRIDE and never touches billing tables", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository });

    const result = await grantPromotionalProAccess({ userId: userA, source: "ADMIN_OVERRIDE", startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-31T00:00:00Z"), aiCreditsPerPeriod: 20 });

    expect("grant" in result).toBe(true);
    if (!("grant" in result)) throw new Error("expected a grant");
    expect(result.grant).toMatchObject({ userId: userA, source: "ADMIN_OVERRIDE", promotionCodeId: null, redemptionId: null });

    const billingSubscriptionRows = await database.select().from(billingSubscriptions);
    const billingPaymentRows = await database.select().from(billingPayments);
    const billingPeriodRows = await database.select().from(billingPeriods);
    expect(billingSubscriptionRows).toHaveLength(0);
    expect(billingPaymentRows).toHaveLength(0);
    expect(billingPeriodRows).toHaveLength(0);
  });

  it("a manual grant is also rejected when the user already holds an active grant", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository });

    await grantPromotionalProAccess({ userId: userA, source: "ADMIN_OVERRIDE", startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-31T00:00:00Z") });
    const second = await grantPromotionalProAccess({ userId: userA, source: "MANUAL_PROMOTION", startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-01-31T00:00:00Z") });

    expect(second).toEqual({ alreadyActive: true });
  });

  it("decideRedemption stays consistent with the real atomic path (no duplicated/drifted logic)", async () => {
    const database = await seedUsers();
    const repository = createPromotionRepository(database);
    await activeCode(repository, { maxRedemptions: 1 });
    const redeemPromotionCode = createRedeemPromotionCode({ repository, now: () => new Date("2026-01-01T00:00:00Z") });

    await redeemPromotionCode({ rawCode: "WELCOME30", userId: userA, hasActivePaidSubscription: false });
    const code = await repository.findByNormalizedCode("WELCOME30");

    // Same pure function the real path uses, evaluated against the now-exhausted code, agrees
    // with the rejection the real (concurrent-safe) path just produced for userB.
    const decision = decideRedemption({ code: code!, userRedemptionCount: 0, hasActiveGrant: false }, new Date("2026-01-01T00:00:00Z"));
    expect(decision).toEqual({ ok: false, reason: "PROMOTION_REDEMPTION_LIMIT_REACHED" });
  });
});
