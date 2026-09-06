import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

import { createAccountRepository } from "../../packages/db/src/repositories/accounts";
import { createCategoryRepository } from "../../packages/db/src/repositories/categories";
import { createClassificationRuleRepository } from "../../packages/db/src/repositories/classification-rules";
import { createCategoryMapRepository } from "../../packages/db/src/repositories/category-map";
import { createTransactionRepository } from "../../packages/db/src/repositories/transactions";
import { createClassificationRuleService } from "../../apps/web/src/features/transactions/services/classification-rule-service";
import { transactions, users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-RULES-PREVIEW (spec 11 §6.8/§6.9/§6.10): preview the match count before saving; retroactive
// apply is explicit and never overwrites a manual correction.

const userId = "00000000-0000-0000-0000-00000000c001";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "rule-preview@example.test", timezone: "UTC", baseCurrency: "ARS" });
  const account = await createAccountRepository(database).create({
    userId, name: "Cuenta", type: "BANK", currencyCode: "ARS", openingBalance: "0", openingDate: "2026-01-01",
  });
  const categories = createCategoryRepository(database);
  const nafta = await categories.create({ userId, name: "Nafta", type: "EXPENSE", parentId: null });
  const otros = await categories.create({ userId, name: "Otros", type: "EXPENSE", parentId: null });
  const transactionsRepo = createTransactionRepository(database);

  const base = {
    userId, accountId: account.id, currencyCode: "ARS", type: "EXPENSE" as const, status: "POSTED" as const,
    occurredAt: new Date("2026-09-10T12:00:00Z"),
  };
  await database.insert(transactions).values([
    { ...base, description: "YPF Ruta 2", merchant: "YPF", amount: "8000", categoryId: otros.id },
    { ...base, description: "Carga YPF", merchant: "ypf full", amount: "12000", categoryId: null },
    { ...base, description: "YPF autopista", merchant: "YPF", amount: "9000", categoryId: nafta.id }, // already right
    { ...base, description: "Kiosco", merchant: "Maxikiosco", amount: "2000", categoryId: otros.id }, // no match
  ]);
  // A YPF row the user categorised by hand — the rule must never touch it (§6.10).
  await database.insert(transactions).values({ ...base, description: "YPF viaje", merchant: "YPF", amount: "15000", categoryId: otros.id });
  await database.execute(
    sql`update transactions set classification = '{"method":"user_explicit","reviewedByUser":true}'::jsonb where description = 'YPF viaje'`,
  );

  const service = createClassificationRuleService({
    rules: createClassificationRuleRepository(database),
    categories,
    transactions: transactionsRepo,
    categoryMap: createCategoryMapRepository(database),
  });
  return { database, service, naftaId: nafta.id, otrosId: otros.id };
}

describe("classification rule preview + retroactive apply", () => {
  it("previews how many movements a rule would recategorise, protecting manual corrections", async () => {
    const { service, naftaId } = await seed();
    const preview = await service.previewRule(userId, { matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf", categoryId: naftaId });

    expect(preview.protectedByManual).toBe(1); // "YPF viaje"
    expect(preview.alreadyInCategory).toBe(1); // "YPF autopista"
    expect(preview.wouldChange).toBe(2); // "YPF Ruta 2" + "Carga YPF"
    expect(preview.sample).toHaveLength(2);
  });

  it("applies the rule retroactively without touching the manual correction", async () => {
    const { database, service, naftaId, otrosId } = await seed();
    const { applied } = await service.createRule(
      userId,
      { matcher: "MERCHANT", mode: "CONTAINS", pattern: "ypf", categoryId: naftaId },
      { retroactive: "ALL" },
    );
    expect(applied).toBe(2);

    const rows = await database.select().from(transactions).where(eq(transactions.userId, userId));
    const byDesc = new Map(rows.map((r) => [r.description, r]));
    expect(byDesc.get("YPF Ruta 2")!.categoryId).toBe(naftaId);
    expect(byDesc.get("Carga YPF")!.categoryId).toBe(naftaId);
    expect(byDesc.get("YPF viaje")!.categoryId).toBe(otrosId); // manual correction preserved
    expect(byDesc.get("Kiosco")!.categoryId).toBe(otrosId); // no match, untouched
    expect((byDesc.get("YPF Ruta 2")!.classification as { method: string }).method).toBe("user_rule");
  });
});
