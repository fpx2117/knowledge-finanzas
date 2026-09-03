import { describe, expect, it } from "vitest";
import { createTransactionService } from "../../apps/web/src/features/transactions/services/transaction-service";

const account = { id: "10000000-0000-0000-0000-000000000001", userId: "user-a", type: "BANK" as const, currencyCode: "ARS", openingDate: "2026-01-01", status: "ACTIVE" as const };
const category = { id: "20000000-0000-0000-0000-000000000001", userId: "user-a", type: "EXPENSE" as const, status: "ACTIVE" as const };
const input = { accountId: account.id, amount: "100.50", description: "Compra", categoryId: category.id, occurredAt: "2026-02-01T12:00:00Z", notes: "Nota" };

function setup(overrides: Partial<typeof account> = {}, categoryOverride = category) {
  const created: Record<string, unknown>[] = [];
  return {
    created,
    service: createTransactionService({
      accounts: { findByIdForUser: async () => ({ ...account, ...overrides }) },
      categories: { findByIdForUser: async () => categoryOverride },
      transactions: { create: async (value) => { created.push(value); return value; } },
      now: () => new Date("2026-02-02T12:00:00Z"),
    }),
  };
}

describe("transaction service", () => {
  it("creates an expense as a positive posted manual magnitude", async () => {
    const { service, created } = setup();
    await service.createExpenseTransaction("user-a", { ...input, merchant: "Comercio" }, "UTC");
    expect(created[0]).toMatchObject({ type: "EXPENSE", amount: "100.50", currencyCode: "ARS", source: "MANUAL", categoryId: category.id });
  });

  it("rejects archived accounts and incompatible categories", async () => {
    await expect(setup({ status: "ARCHIVED" }).service.createExpenseTransaction("user-a", input, "UTC")).rejects.toMatchObject({ code: "ACCOUNT_ARCHIVED" });
    await expect(setup({}, { ...category, type: "INCOME" }).service.createExpenseTransaction("user-a", input, "UTC")).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
  });

  it("rejects future dates and foreign accounts", async () => {
    await expect(setup().service.createExpenseTransaction("user-a", { ...input, occurredAt: "2026-02-03T12:00:00Z" }, "UTC")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const service = createTransactionService({ accounts: { findByIdForUser: async () => undefined }, categories: { findByIdForUser: async () => category }, transactions: { create: async () => ({}) }, now: () => new Date("2026-02-02T12:00:00Z") });
    await expect(service.createIncomeTransaction("user-a", { ...input, categoryId: undefined }, "UTC")).rejects.toMatchObject({ code: "ACCOUNT_NOT_FOUND" });
  });
});

// #12 — corrections as a learning signal.
const merchantGlobalNode = "node-global";
const userNode = "node-user";
const groceriesCategory = { id: "20000000-0000-0000-0000-000000000009", userId: "user-a", type: "EXPENSE" as const, status: "ACTIVE" as const };

function learningSetup(options: {
  match?: { merchantId: string; defaultTaxonomyNodeId: string | null; confidence?: number; matchType?: "EXACT" | "PREFIX" | "CONTAINS" | "REGEX" } | null;
  personal?: { taxonomyNodeId: string };
  nodeForUserCategory?: string;
} = {}) {
  const created: Record<string, unknown>[] = [];
  const aliasCalls: unknown[] = [];
  const upsertCalls: Array<{ userId: string; merchantId: string; taxonomyNodeId: string }> = [];
  const service = createTransactionService({
    accounts: { findByIdForUser: async () => account },
    categories: { findByIdForUser: async () => groceriesCategory },
    transactions: { create: async (value) => { created.push(value); return value; } },
    now: () => new Date("2026-02-02T12:00:00Z"),
    merchants: {
      resolveRaw: async () => (options.match === undefined ? { merchantId: "m-1", canonicalName: "Carrefour", defaultTaxonomyNodeId: merchantGlobalNode, confidence: 0.9, matchType: "CONTAINS" } : options.match),
      findActiveById: async (id: string) => ({ id, canonicalName: "Carrefour", defaultTaxonomyNodeId: merchantGlobalNode }),
      addAlias: async (value) => { aliasCalls.push(value); },
    },
    categoryMap: {
      findUserCategoryForNode: async (nodeId: string) => ({ userCategoryId: nodeId === userNode ? groceriesCategory.id : "cat-other", confidence: "0.95" }),
      resolveNodeForUserCategory: async () => ({ id: options.nodeForUserCategory ?? userNode }),
    },
    merchantDefaults: {
      findForUserMerchant: async () => options.personal,
      upsert: async (value) => { upsertCalls.push(value); },
    },
  });
  return { created, aliasCalls, upsertCalls, service };
}

// §20 — duplicate check before a manual create.
describe("transaction service — duplicate check (§20)", () => {
  const existing = {
    id: "tx-1",
    type: "EXPENSE",
    description: "Carrefour",
    merchant: "Carrefour",
    merchantId: "m-1",
    amount: "15400.000000",
    currencyCode: "ARS",
    occurredAt: new Date("2026-02-01T00:00:00Z"),
    paymentMethod: "DEBIT",
  };
  function dupSetup(rows = [existing]) {
    return createTransactionService({
      accounts: { findByIdForUser: async () => account },
      categories: { findByIdForUser: async () => category },
      transactions: {
        create: async (v) => v,
        listAroundForDuplicateCheck: async () => rows as never,
      },
      now: () => new Date("2026-02-02T12:00:00Z"),
    });
  }

  it("returns the matching transaction for an identical same-day expense", async () => {
    const dup = await dupSetup().findLikelyExpenseDuplicate("user-a", {
      accountId: account.id,
      amount: "15400.00",
      merchant: "CARREFOUR SA",
      occurredAt: "2026-02-01T12:00:00Z",
    });
    expect(dup).toMatchObject({ id: "tx-1", description: "Carrefour" });
  });

  it("returns null when the amount or account differs", async () => {
    expect(await dupSetup().findLikelyExpenseDuplicate("user-a", { accountId: account.id, amount: "9999.00", occurredAt: "2026-02-01T12:00:00Z" })).toBeNull();
  });

  it("does not match an income against an expense", async () => {
    expect(await dupSetup().findLikelyIncomeDuplicate("user-a", { accountId: account.id, amount: "15400.00", occurredAt: "2026-02-01T12:00:00Z" })).toBeNull();
  });

  it("returns null when the repo cannot check", async () => {
    const service = createTransactionService({
      accounts: { findByIdForUser: async () => account },
      categories: { findByIdForUser: async () => category },
      transactions: { create: async (v) => v },
      now: () => new Date("2026-02-02T12:00:00Z"),
    });
    expect(await service.findLikelyExpenseDuplicate("user-a", { accountId: account.id, amount: "15400.00", occurredAt: "2026-02-01T12:00:00Z" })).toBeNull();
  });
});

describe("transaction service — corrections as learning (#12)", () => {
  it("records a personal merchant→category override when the user picks a category different from the merchant global default", async () => {
    // resolveRaw returns the global node; the user explicitly picks a category mapped to userNode.
    const s = learningSetup();
    await s.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "carre" }, "UTC");
    expect(s.upsertCalls).toEqual([{ userId: "user-a", merchantId: "m-1", taxonomyNodeId: userNode }]);
  });

  it("does not record an override when the chosen category already matches the merchant global default", async () => {
    const s = learningSetup({ nodeForUserCategory: merchantGlobalNode });
    await s.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "carre" }, "UTC");
    expect(s.upsertCalls).toEqual([]);
  });

  it("does not record an override when it already equals the user's existing personal default", async () => {
    const s = learningSetup({ personal: { taxonomyNodeId: userNode } });
    await s.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "carre" }, "UTC");
    expect(s.upsertCalls).toEqual([]);
  });

  it("inherits the personal override (not the global default) when the user picks no category", async () => {
    const s = learningSetup({ personal: { taxonomyNodeId: userNode } });
    await s.service.createExpenseTransaction("user-a", { accountId: account.id, amount: "100.50", description: "Compra", occurredAt: "2026-02-01T12:00:00Z", merchant: "carre" }, "UTC");
    expect(s.created[0]).toMatchObject({ categoryId: groceriesCategory.id, classification: { method: "merchant_default", categoryConfidence: 1 } });
  });

  it("pins the typed string as a private exact alias on a fuzzy (PREFIX/CONTAINS) match", async () => {
    const s = learningSetup({ match: { merchantId: "m-1", defaultTaxonomyNodeId: merchantGlobalNode, confidence: 0.9, matchType: "PREFIX" } });
    await s.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "carre" }, "UTC");
    expect(s.aliasCalls).toEqual([{ merchantId: "m-1", rawOrPattern: "carre", matchType: "EXACT", source: "USER", addedByUserId: "user-a" }]);
  });

  it("does not pin an alias on an exact match or when the merchant was selected explicitly", async () => {
    const exact = learningSetup({ match: { merchantId: "m-1", defaultTaxonomyNodeId: merchantGlobalNode, matchType: "EXACT" } });
    await exact.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "carrefour" }, "UTC");
    expect(exact.aliasCalls).toEqual([]);

    const selected = learningSetup();
    await selected.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchantId: "m-1" }, "UTC");
    expect(selected.aliasCalls).toEqual([]);
  });
});

// #13 — progressive trust.
function trustSetup(options: { priorCount: number; personal?: { taxonomyNodeId: string } }) {
  const created: Record<string, unknown>[] = [];
  const service = createTransactionService({
    accounts: { findByIdForUser: async () => account },
    categories: { findByIdForUser: async () => groceriesCategory },
    transactions: {
      create: async (value) => { created.push(value); return value; },
      countClassifiedForMerchantNode: async () => options.priorCount,
    },
    now: () => new Date("2026-02-02T12:00:00Z"),
    merchants: {
      resolveRaw: async () => ({ merchantId: "m-1", canonicalName: "Carrefour", defaultTaxonomyNodeId: merchantGlobalNode, confidence: 0.95, matchType: "EXACT" }),
    },
    categoryMap: {
      findUserCategoryForNode: async () => ({ userCategoryId: groceriesCategory.id, confidence: "0.95" }),
      resolveNodeForUserCategory: async () => ({ id: merchantGlobalNode }),
    },
    merchantDefaults: {
      findForUserMerchant: async () => options.personal,
      upsert: async () => undefined,
    },
  });
  return { created, service };
}

// The user does not pick a category — the merchant default is the only candidate.
const noCategory = { accountId: account.id, amount: "100.50", description: "Compra", occurredAt: "2026-02-01T12:00:00Z", merchant: "carrefour" };

describe("transaction service — progressive trust (#13)", () => {
  it("only suggests (does not apply) a merchant category the user has seen 2 times or fewer", async () => {
    const s = trustSetup({ priorCount: 1 });
    await s.service.createExpenseTransaction("user-a", noCategory, "UTC");
    expect(s.created[0]).toMatchObject({
      categoryId: null,
      classification: { method: "suggested", automationLevel: "ask", suggestion: { categoryId: groceriesCategory.id } },
    });
  });

  it("auto-applies with an undo affordance once the pattern has been seen a few times", async () => {
    const s = trustSetup({ priorCount: 5 });
    await s.service.createExpenseTransaction("user-a", noCategory, "UTC");
    expect(s.created[0]).toMatchObject({ categoryId: groceriesCategory.id, classification: { method: "merchant_default", automationLevel: "auto_undo" } });
  });

  it("applies silently once the pattern is well established", async () => {
    const s = trustSetup({ priorCount: 12 });
    await s.service.createExpenseTransaction("user-a", noCategory, "UTC");
    expect(s.created[0]).toMatchObject({ categoryId: groceriesCategory.id, classification: { automationLevel: "silent" } });
  });

  it("never merely asks for a personal override — a taught pattern is applied from the first use", async () => {
    const s = trustSetup({ priorCount: 0, personal: { taxonomyNodeId: merchantGlobalNode } });
    await s.service.createExpenseTransaction("user-a", noCategory, "UTC");
    expect(s.created[0]).toMatchObject({ categoryId: groceriesCategory.id, classification: { method: "merchant_default", automationLevel: "auto_undo" } });
  });

  it("records the provenance the '¿Por qué?' explanation is built from (#14)", async () => {
    const s = trustSetup({ priorCount: 5 });
    await s.service.createExpenseTransaction("user-a", noCategory, "UTC");
    expect(s.created[0].classification).toMatchObject({
      merchantName: "Carrefour",
      merchantMatch: "exact",
      categorySource: "merchant_default",
      priorSimilarCount: 5,
    });
  });
});

// #15 — explicit user classification rules.
const fuelCategory = { id: "20000000-0000-0000-0000-00000000000f", userId: "user-a", type: "EXPENSE" as const, status: "ACTIVE" as const };

function ruleSetup(options: {
  rules: Array<{ id: string; matcher: "MERCHANT" | "DESCRIPTION"; mode: "CONTAINS" | "EQUALS" | "STARTS_WITH"; pattern: string; categoryId: string; priority: number }>;
  ruleCategory?: { id: string; type: "INCOME" | "EXPENSE"; status: "ACTIVE" | "ARCHIVED" };
}) {
  const created: Record<string, unknown>[] = [];
  const service = createTransactionService({
    accounts: { findByIdForUser: async () => account },
    categories: {
      findByIdForUser: async (id: string) => {
        if (options.ruleCategory && id === options.ruleCategory.id) return { ...options.ruleCategory, userId: "user-a" };
        if (id === fuelCategory.id) return fuelCategory;
        return groceriesCategory;
      },
    },
    transactions: { create: async (value) => { created.push(value); return value; } },
    now: () => new Date("2026-02-02T12:00:00Z"),
    merchants: {
      resolveRaw: async () => ({ merchantId: "m-1", canonicalName: "YPF", defaultTaxonomyNodeId: merchantGlobalNode, confidence: 0.95, matchType: "EXACT" }),
    },
    categoryMap: {
      findUserCategoryForNode: async () => ({ userCategoryId: groceriesCategory.id, confidence: "0.95" }),
      resolveNodeForUserCategory: async () => ({ id: "node-fuel" }),
    },
    classificationRules: { listActiveForUser: async () => options.rules },
  });
  return { created, service };
}

const fuelRule = { id: "rule-1", matcher: "MERCHANT" as const, mode: "CONTAINS" as const, pattern: "ypf", categoryId: fuelCategory.id, priority: 100 };

describe("transaction service — user rules (#15)", () => {
  it("applies a matching rule over the merchant's inferred category", async () => {
    const s = ruleSetup({ rules: [fuelRule], ruleCategory: fuelCategory });
    await s.service.createExpenseTransaction("user-a", { accountId: account.id, amount: "30000", description: "carga", occurredAt: "2026-02-01T12:00:00Z", merchant: "MERPAGO*YPF" }, "UTC");
    expect(s.created[0]).toMatchObject({
      categoryId: fuelCategory.id,
      classification: { method: "user_rule", ruleId: "rule-1", ruleMatcher: "MERCHANT", rulePattern: "ypf", automationLevel: "silent" },
    });
  });

  it("does not apply a rule when the user picked a category explicitly", async () => {
    const s = ruleSetup({ rules: [fuelRule], ruleCategory: fuelCategory });
    await s.service.createExpenseTransaction("user-a", { ...input, categoryId: groceriesCategory.id, merchant: "YPF" }, "UTC");
    expect(s.created[0]).toMatchObject({ categoryId: groceriesCategory.id, classification: { method: "user_explicit" } });
  });

  it("skips a rule whose category is archived or the wrong type", async () => {
    const archived = ruleSetup({ rules: [fuelRule], ruleCategory: { ...fuelCategory, status: "ARCHIVED" } });
    await archived.service.createExpenseTransaction("user-a", { accountId: account.id, amount: "30000", description: "carga", occurredAt: "2026-02-01T12:00:00Z", merchant: "YPF" }, "UTC");
    expect(archived.created[0].classification).toMatchObject({ method: "merchant_default" });

    const wrongType = ruleSetup({ rules: [fuelRule], ruleCategory: { ...fuelCategory, type: "INCOME" } });
    await wrongType.service.createExpenseTransaction("user-a", { accountId: account.id, amount: "30000", description: "carga", occurredAt: "2026-02-01T12:00:00Z", merchant: "YPF" }, "UTC");
    expect(wrongType.created[0].classification).toMatchObject({ method: "merchant_default" });
  });
});
