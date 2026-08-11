import { describe, expect, it } from "vitest";

import { createAICreditRepository } from "../../packages/db/src/repositories/ai-credits";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000101";
const userB = "00000000-0000-0000-0000-000000000102";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "User A", email: "ai-credits-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "User B", email: "ai-credits-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
}

const futureExpiry = new Date("2099-01-01T00:00:00Z");

describe("ai credit repository", () => {
  it("grants trial credits exactly once per user (idempotent on repeated grant)", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);

    const first = await repo.grantTrialCredits({ userId: userA, amount: 50, expiresAt: futureExpiry });
    const second = await repo.grantTrialCredits({ userId: userA, amount: 50, expiresAt: futureExpiry });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.entry?.id).toBe(first.entry?.id);
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 50 });
  });

  it("grants plan credits exactly once per (user, billing period) but allows a new period to grant again", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);

    const periodOne = await repo.grantPlanCredits({ userId: userA, amount: 300, referenceId: "period-1", expiresAt: futureExpiry });
    const periodOneRetry = await repo.grantPlanCredits({ userId: userA, amount: 300, referenceId: "period-1", expiresAt: futureExpiry });
    const periodTwo = await repo.grantPlanCredits({ userId: userA, amount: 300, referenceId: "period-2", expiresAt: futureExpiry });

    expect(periodOne.created).toBe(true);
    expect(periodOneRetry.created).toBe(false);
    expect(periodTwo.created).toBe(true);
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ PLAN_ALLOWANCE: 600 });
  });

  it("a repeated operationId returns the original reservation instead of reserving twice", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 10, expiresAt: futureExpiry });

    const first = await repo.reserve({ userId: userA, capability: "transaction.categorize", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "op-1", expiresAt: futureExpiry });
    const second = await repo.reserve({ userId: userA, capability: "transaction.categorize", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "op-1", expiresAt: futureExpiry });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    if (first.allowed && second.allowed) expect(second.reservation.id).toBe(first.reservation.id);

    // Only one reservation's worth of credits should be held, not two.
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 6 });
  });

  it("denies a reservation that would exceed the available balance", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 3, expiresAt: futureExpiry });

    const result = await repo.reserve({ userId: userA, capability: "assistant.query.complex", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "op-deny", expiresAt: futureExpiry });

    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.available).toBe(3);
  });

  it("concurrency invariant: with 4 credits, two concurrent 4-credit reservations resolve to exactly one success", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 4, expiresAt: futureExpiry });

    const [resultA, resultB] = await Promise.all([
      repo.reserve({ userId: userA, capability: "assistant.query.complex", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "concurrent-a", expiresAt: futureExpiry }),
      repo.reserve({ userId: userA, capability: "assistant.query.complex", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "concurrent-b", expiresAt: futureExpiry }),
    ]);

    const allowedCount = [resultA, resultB].filter((result) => result.allowed).length;
    expect(allowedCount).toBe(1);
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 0 });
  });

  it("commit writes exactly one CONSUMPTION entry and moves the reservation to COMMITTED", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 10, expiresAt: futureExpiry });

    const reserved = await repo.reserve({ userId: userA, capability: "transaction.categorize", pool: "TRIAL_ALLOWANCE", credits: 1, operationId: "op-commit", expiresAt: futureExpiry });
    if (!reserved.allowed) throw new Error("expected reservation to succeed");

    const committed = await repo.commit(reserved.reservation.id);
    const committedAgain = await repo.commit(reserved.reservation.id);

    expect(committed?.status).toBe("COMMITTED");
    expect(committed?.creditEntryId).toBeTruthy();
    expect(committedAgain?.id).toBe(committed?.id);
    expect(committedAgain?.creditEntryId).toBe(committed?.creditEntryId);

    // The ledger balance settles at 9 (10 granted - 1 consumed); no PENDING hold remains.
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 9 });
  });

  it("release frees the held credits and moves the reservation to RELEASED", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 10, expiresAt: futureExpiry });

    const reserved = await repo.reserve({ userId: userA, capability: "transaction.categorize", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "op-release", expiresAt: futureExpiry });
    if (!reserved.allowed) throw new Error("expected reservation to succeed");

    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 6 });
    const released = await repo.release(reserved.reservation.id);
    expect(released?.status).toBe("RELEASED");
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 10 });
  });

  it("reconciliation marks stale PENDING reservations as EXPIRED and frees their held credits", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 10, expiresAt: futureExpiry });

    const past = new Date("2020-01-01T00:00:00Z");
    const reserved = await repo.reserve({ userId: userA, capability: "transaction.categorize", pool: "TRIAL_ALLOWANCE", credits: 4, operationId: "op-stale", expiresAt: past });
    if (!reserved.allowed) throw new Error("expected reservation to succeed");

    const stale = await repo.listStalePending(new Date());
    expect(stale.map((reservation) => reservation.id)).toContain(reserved.reservation.id);

    const expired = await repo.markExpired(stale.map((reservation) => reservation.id));
    expect(expired.find((reservation) => reservation.id === reserved.reservation.id)?.status).toBe("EXPIRED");
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 10 });
  });

  it("keeps balances scoped per user", async () => {
    await seedUsers();
    const repo = createAICreditRepository(getTestDatabase().db);
    await repo.grantTrialCredits({ userId: userA, amount: 10, expiresAt: futureExpiry });
    await repo.grantTrialCredits({ userId: userB, amount: 20, expiresAt: futureExpiry });

    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 10 });
    await expect(repo.getAvailableBalances(userB)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 20 });
  });
});
