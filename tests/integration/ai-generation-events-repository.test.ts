import { describe, expect, it } from "vitest";

import { createAIGenerationEventRepository, type AIGenerationEventInput } from "../../packages/db/src/repositories/ai-generation-events";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000701";
const userB = "00000000-0000-0000-0000-000000000702";

async function seedUsers() {
  const database = getTestDatabase().db;
  await database.insert(users).values([
    { id: userA, name: "Gen A", email: "gen-a@example.test", timezone: "UTC", baseCurrency: "ARS" },
    { id: userB, name: "Gen B", email: "gen-b@example.test", timezone: "UTC", baseCurrency: "ARS" },
  ]);
}

function event(overrides: Partial<AIGenerationEventInput>): AIGenerationEventInput {
  return {
    userId: userA,
    capability: "assistant.query.simple",
    modelRole: "FAST",
    resolvedModel: "openai/gpt-4o-mini",
    provider: "openrouter",
    generationId: "gen-x",
    operationId: "op-x",
    status: "SUCCESS",
    errorCode: null,
    inputTokens: 100,
    outputTokens: 20,
    cachedInputTokens: 0,
    costUsd: 0.0001,
    creditsCharged: 2,
    latencyMs: 800,
    ...overrides,
  };
}

const wide = { from: new Date("2000-01-01T00:00:00Z"), to: new Date("2100-01-01T00:00:00Z") };
const past = { from: new Date("2000-01-01T00:00:00Z"), to: new Date("2000-02-01T00:00:00Z") };

describe("ai generation events repository", () => {
  it("records rows and aggregates real USD cost + tokens", async () => {
    await seedUsers();
    const repo = createAIGenerationEventRepository(getTestDatabase().db);

    await repo.record(event({ costUsd: 0.0002, inputTokens: 100, outputTokens: 20, creditsCharged: 2 }));
    await repo.record(event({ costUsd: 0.0003, inputTokens: 200, outputTokens: 40, creditsCharged: 4, capability: "scenario.simulate" }));
    await repo.record(event({ userId: userB, costUsd: 1, creditsCharged: 2 }));

    const userATotals = await repo.sumForUser(userA, wide);
    expect(userATotals.calls).toBe(2);
    expect(Number(userATotals.costUsd)).toBeCloseTo(0.0005, 6);
    expect(userATotals.inputTokens).toBe(300);
    expect(userATotals.creditsCharged).toBe(6);

    await expect(repo.sumForUser(userA, past)).resolves.toMatchObject({ calls: 0, costUsd: "0" });

    expect((await repo.sumTotal(wide)).calls).toBe(3);
    expect((await repo.sumByCapability(wide)).find((r) => r.capability === "scenario.simulate")?.calls).toBe(1);
    expect((await repo.sumByUser(wide)).find((r) => r.email === "gen-b@example.test")?.calls).toBe(1);
    expect((await repo.sumByModel(wide)).find((r) => r.resolvedModel === "openai/gpt-4o-mini")?.calls).toBe(3);
  });

  it("stores costUsd as null when the provider didn't report it", async () => {
    await seedUsers();
    const repo = createAIGenerationEventRepository(getTestDatabase().db);
    await repo.record(event({ costUsd: null }));
    const [row] = await repo.listForUser(userA, 1);
    expect(row.costUsd).toBeNull();
  });
});
