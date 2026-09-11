import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createBudgetRepository } from "../../packages/db/src/repositories/budgets";
import { createInsightRepository } from "../../packages/db/src/repositories/insights";
import { createInsightService } from "../../apps/web/src/features/insights/services/insight-service";
import { debtInstallments, debts, insights as insightsTable, merchants, subscriptions, transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-INSIGHT-DETECTORS (spec 09 §8/§17/§18): the engine persists detected insights, dedupes on
// re-run, honours the dismiss cooldown, and resolves an insight once its condition is gone.

const userId = "00000000-0000-0000-0000-0000000105a1";
const user = { id: userId, timezone: "UTC", baseCurrency: "ARS" };
const now = () => new Date("2026-09-20T12:00:00Z");

async function seed({ withBudgetBreach }: { withBudgetBreach: boolean }) {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "insight-engine@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "5000000", openingDate: "2026-01-01",
  });
  const categories = createCategoryRepository(database);
  const food = await categories.create({ userId, name: "Delivery", type: "EXPENSE", parentId: null });
  await createBudgetRepository(database).create({ userId, categoryId: food.id, name: null, currencyCode: "ARS", limitAmount: "50000", startDate: "2026-01-01" });

  const row = (over: Partial<typeof transactions.$inferInsert>) => ({
    userId, accountId: account.id, currencyCode: "ARS", description: "x", type: "EXPENSE" as const,
    status: "POSTED" as const, occurredAt: new Date("2026-09-10T12:00:00Z"), amount: "1000", ...over,
  });

  const rows = [
    // 6 uncategorised expenses → INS-DATA-QUALITY
    ...Array.from({ length: 6 }, (_, i) => row({ categoryId: null, amount: "2000", description: `sin cat ${i}` })),
  ];
  if (withBudgetBreach) {
    rows.push(row({ categoryId: food.id, amount: "80000", description: "pedido caro" })); // 80k > 50k limit
  }
  await database.insert(transactions).values(rows);

  return { database, service: createInsightService(database, now) };
}

describe("insight engine (integration)", () => {
  it("persists detected insights and dedupes them on a second run", async () => {
    const { database, service } = await seed({ withBudgetBreach: true });

    await service.refreshInsights(user);
    let stored = await database.select().from(insightsTable).where(eq(insightsTable.userId, userId));
    // Also fires INS-ANOMALY-AMOUNT: the 80k "pedido caro" dwarfs the 6× 2k uncategorised rows.
    expect(stored.map((s) => s.family).sort()).toEqual(["INS-ANOMALY-AMOUNT", "INS-BUDGET-LIMIT", "INS-DATA-QUALITY"]);
    expect(stored.every((s) => s.status === "ACTIVE")).toBe(true);

    const countAfterFirstRun = stored.length;
    await service.refreshInsights(user);
    stored = await database.select().from(insightsTable).where(eq(insightsTable.userId, userId));
    expect(stored).toHaveLength(countAfterFirstRun); // no duplicates
  });

  it("countActiveForUser drops as insights are seen or dismissed (sidebar badge, spec 13 §6.13)", async () => {
    const { database, service } = await seed({ withBudgetBreach: true });
    const repo = createInsightRepository(database);
    await service.refreshInsights(user);

    const active = await repo.countActiveForUser(userId);
    expect(active).toBeGreaterThan(0);

    // Opening one marks it SEEN → it stops counting.
    const queue = await service.getQueue(user, { refresh: false });
    await service.getDetail({ id: userId }, queue[0]!.id);
    expect(await repo.countActiveForUser(userId)).toBe(active - 1);
  });

  it("keeps a dismissed insight out of the queue during its cooldown", async () => {
    const { service } = await seed({ withBudgetBreach: true });
    await service.refreshInsights(user);

    const queue = await service.getQueue(user, { refresh: false });
    const budget = queue.find((i) => i.family === "INS-BUDGET-LIMIT")!;
    await service.dismiss({ id: userId }, budget.id, "ALREADY_KNEW");

    await service.refreshInsights(user);
    const after = await service.getQueue(user, { refresh: false });
    expect(after.some((i) => i.family === "INS-BUDGET-LIMIT")).toBe(false);
    expect(after.some((i) => i.family === "INS-DATA-QUALITY")).toBe(true);
  });

  it("resolves an insight once its condition disappears", async () => {
    const { database, service } = await seed({ withBudgetBreach: true });
    await service.refreshInsights(user);

    // remove the big Delivery order → budget no longer breached
    await database.delete(transactions).where(eq(transactions.description, "pedido caro"));

    await service.refreshInsights(user);
    const stored = await database.select().from(insightsTable).where(eq(insightsTable.userId, userId));
    const budget = stored.find((s) => s.family === "INS-BUDGET-LIMIT")!;
    expect(budget.status).toBe("RESOLVED");
    expect(budget.resolvedAt).not.toBeNull();
  });

  // WP-DEGRADED (gate G5): the E2E env runs with AI_ENABLED=false, so every insight the user ever
  // sees is produced without a single AI call. This locks that in — the detected/queued/detailed
  // insight is fully self-describing (title, body, evidence, calculationVersion) with no AI in the
  // path; the AI "Explicar" button is purely additive on top of it (spec 09 §20).
  it("produces fully-populated insights (title, body, evidence) with no AI in the path", async () => {
    const { service } = await seed({ withBudgetBreach: true });
    await service.refreshInsights(user);

    const queue = await service.getQueue(user, { refresh: false });
    expect(queue.length).toBeGreaterThan(0);
    for (const insight of queue) {
      expect(insight.title.length).toBeGreaterThan(0);
      expect(insight.body.length).toBeGreaterThan(0);
    }

    const detail = await service.getDetail({ id: userId }, queue[0]!.id);
    expect(detail).not.toBeNull();
    expect(detail!.body.length).toBeGreaterThan(0);
    expect(detail!.evidence).toBeTruthy();
  });

  it("getQueue wraps its own refresh so a refresh failure can never break the page", async () => {
    const { service } = await seed({ withBudgetBreach: true });
    await service.refreshInsights(user);
    const stored = await service.getQueue(user, { refresh: false });
    expect(stored.length).toBeGreaterThan(0);

    // getQueue's default path runs refreshInsights().catch(() => undefined) — even under the worst
    // case it returns the already-detected queue, an array, without throwing.
    const withRefresh = await service.getQueue(user);
    expect(Array.isArray(withRefresh)).toBe(true);
    expect(withRefresh.length).toBeGreaterThanOrEqual(stored.length);
  });

  // WP-KAI-DETECTORS-6: the 6 detectors added 2026-09-11.
  it("detects an obligation due soon (INS-OBL-DUE)", async () => {
    const { database, service } = await seed({ withBudgetBreach: false });
    const [debt] = await database
      .insert(debts)
      .values({ userId, name: "Heladera en cuotas", type: "PURCHASE_INSTALLMENTS", currencyCode: "ARS", originalAmount: "300000", startDate: "2026-08-01" })
      .returning();
    await database.insert(debtInstallments).values({
      debtId: debt.id, installmentNumber: 1, dueDate: "2026-09-25", totalAmount: "100000", principalAmount: "100000",
    });

    await service.refreshInsights(user);
    const queue = await service.getQueue(user, { refresh: false });
    const oblDue = queue.find((i) => i.family === "INS-OBL-DUE");
    expect(oblDue).toBeDefined();
    expect(oblDue!.body).toContain("Heladera en cuotas");
  });

  it("detects a subscription price change (INS-REC-AMOUNT)", async () => {
    const { database, service } = await seed({ withBudgetBreach: false });
    // `merchants` is a shared catalog table, not user-scoped — the test harness never
    // truncates it between runs, so the slug must be unique per invocation, not fixed.
    const [merchant] = await database
      .insert(merchants)
      .values({ slug: `netflix-test-${randomUUID()}`, canonicalName: "Netflix" })
      .returning();
    await database.insert(subscriptions).values({
      userId,
      merchantId: merchant.id,
      label: "Netflix",
      frequency: "MONTHLY",
      currencyCode: "ARS",
      currentAmount: "6500",
      priceHistory: [{ amount: "5000", from: "2026-08-01" }],
      firstChargedOn: "2026-01-04",
      lastChargedOn: "2026-09-04",
      nextExpectedOn: "2026-10-04",
      chargeCount: 9,
      confidence: "0.950",
    });

    await service.refreshInsights(user);
    const queue = await service.getQueue(user, { refresh: false });
    const priceChange = queue.find((i) => i.family === "INS-REC-AMOUNT");
    expect(priceChange).toBeDefined();
    expect(priceChange!.body).toContain("Netflix");
    expect(priceChange!.body).toContain("30%");
  });
});
