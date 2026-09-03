#!/usr/bin/env -S npx tsx
// `pnpm db:backfill-transactions` — one-shot, idempotent backfill of the canonical columns added
// after transactions already existed: merchant_id (from the raw merchant string via the alias
// ladder), taxonomy_node_id (from category_id via category_map), payment_method (from the
// account type). Only fills NULLs — safe to re-run.
import { and, eq, isNull, sql } from "drizzle-orm";

import { createDatabaseClient } from "../src/client";
import { accounts, categoryMap, transactions } from "../src/schema";
import { createMerchantRepository } from "../src/repositories/merchants";

const PAYMENT_METHOD_BY_ACCOUNT: Record<string, "CASH" | "DEBIT" | "WALLET"> = {
  CASH: "CASH",
  DIGITAL_WALLET: "WALLET",
  BANK: "DEBIT",
  SAVINGS: "DEBIT",
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("db:backfill-transactions requires DATABASE_URL.");
    process.exit(1);
  }
  const { db } = createDatabaseClient(databaseUrl);
  const merchantRepo = createMerchantRepository(db);

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      merchant: transactions.merchant,
      merchantId: transactions.merchantId,
      categoryId: transactions.categoryId,
      taxonomyNodeId: transactions.taxonomyNodeId,
      paymentMethod: transactions.paymentMethod,
      accountType: accounts.type,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId));

  let merchantFilled = 0;
  let taxonomyFilled = 0;
  let methodFilled = 0;

  for (const row of rows) {
    const patch: Record<string, unknown> = {};

    if (!row.merchantId && row.merchant) {
      const match = await merchantRepo.resolveRaw(row.merchant);
      if (match) {
        patch.merchantId = match.merchantId;
        merchantFilled += 1;
      }
    }

    if (!row.taxonomyNodeId && row.categoryId) {
      const [mapping] = await db
        .select({ nodeId: categoryMap.taxonomyNodeId })
        .from(categoryMap)
        .where(and(eq(categoryMap.userCategoryId, row.categoryId), eq(categoryMap.userId, row.userId)))
        .limit(1);
      if (mapping) {
        patch.taxonomyNodeId = mapping.nodeId;
        taxonomyFilled += 1;
      }
    }

    if (!row.paymentMethod && row.accountType) {
      const method = PAYMENT_METHOD_BY_ACCOUNT[row.accountType] ?? "OTHER";
      patch.paymentMethod = method;
      methodFilled += 1;
    }

    if (Object.keys(patch).length > 0) {
      await db.update(transactions).set(patch).where(eq(transactions.id, row.id));
    }
  }

  console.log(
    `Backfilled ${rows.length} transactions: +${merchantFilled} merchant_id, +${taxonomyFilled} taxonomy_node_id, +${methodFilled} payment_method.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
