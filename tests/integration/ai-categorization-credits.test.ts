import { describe, expect, it } from "vitest";
import { AIError, createAICreditService, createExecuteAICapability, type AIProvider } from "@know-finanzas/ai";

import { createAICreditRepository } from "../../packages/db/src/repositories/ai-credits";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

const userA = "00000000-0000-0000-0000-000000000301";
const futureExpiry = new Date("2099-01-01T00:00:00Z");

async function seedUserWithTrialCredits(amount: number) {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userA, name: "User A", email: "categorize-credits@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const repo = createAICreditRepository(database);
  if (amount > 0) await repo.grantTrialCredits({ userId: userA, amount, expiresAt: futureExpiry });
  return repo;
}

function buildExecutor(repo: ReturnType<typeof createAICreditRepository>, provider: AIProvider) {
  const creditService = createAICreditService(repo);
  const executeAICapability = createExecuteAICapability({
    aiEnabled: true,
    creditService,
    resolveAccess: async () => "TRIAL",
  });

  return async (operationId: string) => executeAICapability({
    userId: userA,
    capability: "transaction.categorize",
    operationId,
    execute: () => provider.generateStructured({
      role: "FAST",
      capability: "transaction.categorize",
      promptVersion: "v1",
      prompt: "categorize",
      schema: { parse: (value: unknown) => value } as never,
      schemaName: "s",
    }),
  });
}

describe("executeAICapability + real AI credit repository (transaction.categorize)", () => {
  it("prevents provider execution when the user has insufficient credits", async () => {
    const repo = await seedUserWithTrialCredits(0);
    const provider: AIProvider = { generateStructured: async () => { throw new Error("should not be called"); } };
    const execute = buildExecutor(repo, provider);

    await expect(execute("op-insufficient")).rejects.toMatchObject({ code: "AI_CREDITS_EXHAUSTED" });
  });

  it("does not permanently consume credits when the provider fails", async () => {
    const repo = await seedUserWithTrialCredits(50);
    const provider: AIProvider = { generateStructured: async () => { throw new AIError("AI_PROVIDER_ERROR"); } };
    const execute = buildExecutor(repo, provider);

    await expect(execute("op-fail")).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 50 });
  });

  it("commits exactly the categorization capability's cost on success", async () => {
    const repo = await seedUserWithTrialCredits(50);
    const provider: AIProvider = { generateStructured: async () => ({ data: { candidate: null, confidence: 0.9 }, raw: "{}", model: "m", usage: { inputTokens: 1, outputTokens: 1 }, generationId: "g" }) };
    const execute = buildExecutor(repo, provider);

    await execute("op-success");

    // transaction.categorize costs 1 credit (packages/ai/src/credits/credit-costs.ts).
    await expect(repo.getAvailableBalances(userA)).resolves.toMatchObject({ TRIAL_ALLOWANCE: 49 });
  });
});
