#!/usr/bin/env -S npx tsx
// `pnpm db:seed-taxonomy` — idempotent upsert of KNOWLEDGE's reference data: the canonical
// category taxonomy (`category_taxonomy`) and the seed merchant set (`merchants` /
// `merchant_aliases`), both keyed by slug. Safe to run on every deploy: existing rows are updated
// in place, new rows inserted, and taxonomy nodes no longer defined are marked inactive (never
// deleted — user category_map rows and historical aggregates may still reference them).
import { eq, sql } from "drizzle-orm";

import { createDatabaseClient } from "../src/client";
import { categoryTaxonomy, merchantAliases, merchants } from "../src/schema";
import { flattenTaxonomy, TAXONOMY_VERSION } from "../src/taxonomy/category-taxonomy";
import { MERCHANT_SEED } from "../src/merchants/merchant-seed";
import { normalizeMerchant } from "../src/merchants/normalize";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("db:seed-taxonomy requires DATABASE_URL to be set.");
    process.exit(1);
  }

  const { db } = createDatabaseClient(databaseUrl);
  const nodes = flattenTaxonomy();
  const seededSlugs = nodes.map((node) => node.slug);

  await db.transaction(async (tx) => {
    // Pass 1 — upsert every node without its parent link.
    for (const node of nodes) {
      await tx
        .insert(categoryTaxonomy)
        .values({
          level: node.level,
          type: node.type,
          slug: node.slug,
          displayName: node.displayName,
          mcc: node.mcc,
          sortOrder: node.sortOrder,
          version: TAXONOMY_VERSION,
          active: true,
        })
        .onConflictDoUpdate({
          target: categoryTaxonomy.slug,
          set: {
            level: node.level,
            type: node.type,
            displayName: node.displayName,
            mcc: node.mcc,
            sortOrder: node.sortOrder,
            version: TAXONOMY_VERSION,
            active: true,
            updatedAt: new Date(),
          },
        });
    }

    // Pass 2 — resolve parent slugs to ids and set parent_id.
    const rows = await tx.select({ id: categoryTaxonomy.id, slug: categoryTaxonomy.slug }).from(categoryTaxonomy);
    const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
    for (const node of nodes) {
      const parentId = node.parentSlug ? idBySlug.get(node.parentSlug) ?? null : null;
      await tx
        .update(categoryTaxonomy)
        .set({ parentId })
        .where(sql`${categoryTaxonomy.slug} = ${node.slug}`);
    }

    // Retire nodes dropped from the taxonomy definition.
    const retired = await tx
      .update(categoryTaxonomy)
      .set({ active: false, updatedAt: new Date() })
      .where(sql`${categoryTaxonomy.slug} not in ${seededSlugs} and ${categoryTaxonomy.active} = true`)
      .returning({ slug: categoryTaxonomy.slug });

    console.log(`Seeded ${nodes.length} taxonomy nodes (version ${TAXONOMY_VERSION}).`);
    if (retired.length > 0) console.log(`Retired ${retired.length} node(s): ${retired.map((r) => r.slug).join(", ")}`);

    // ── Merchants ────────────────────────────────────────────────────────────
    const taxonomyIdBySlug = new Map(rows.map((row) => [row.slug, row.id]));

    // Pass 1 — upsert merchant identities (no group link yet).
    for (const seed of MERCHANT_SEED) {
      await tx
        .insert(merchants)
        .values({
          slug: seed.slug,
          canonicalName: seed.name,
          defaultTaxonomyNodeId: seed.taxonomySlug ? taxonomyIdBySlug.get(seed.taxonomySlug) ?? null : null,
          homeCountry: "AR",
          active: true,
        })
        .onConflictDoUpdate({
          target: merchants.slug,
          set: {
            canonicalName: seed.name,
            defaultTaxonomyNodeId: seed.taxonomySlug ? taxonomyIdBySlug.get(seed.taxonomySlug) ?? null : null,
            active: true,
            updatedAt: new Date(),
          },
        });
    }

    // Pass 2 — resolve group links.
    const merchantRows = await tx.select({ id: merchants.id, slug: merchants.slug }).from(merchants);
    const merchantIdBySlug = new Map(merchantRows.map((row) => [row.slug, row.id]));
    for (const seed of MERCHANT_SEED) {
      await tx
        .update(merchants)
        .set({ merchantGroupId: seed.groupSlug ? merchantIdBySlug.get(seed.groupSlug) ?? null : null })
        .where(eq(merchants.slug, seed.slug));
    }

    // Pass 3 — aliases: canonical name as EXACT + every listed alias as CONTAINS.
    let aliasCount = 0;
    for (const seed of MERCHANT_SEED) {
      const merchantId = merchantIdBySlug.get(seed.slug);
      if (!merchantId) continue;
      const entries: Array<{ pattern: string; matchType: "EXACT" | "CONTAINS" }> = [
        { pattern: normalizeMerchant(seed.name), matchType: "EXACT" },
        ...seed.aliases.map((alias) => ({ pattern: normalizeMerchant(alias), matchType: "CONTAINS" as const })),
      ].filter((entry) => entry.pattern.length > 0);

      for (const entry of entries) {
        const inserted = await tx
          .insert(merchantAliases)
          .values({ merchantId, pattern: entry.pattern, matchType: entry.matchType, source: "SEED" })
          .onConflictDoNothing({ target: [merchantAliases.pattern, merchantAliases.matchType] })
          .returning({ id: merchantAliases.id });
        aliasCount += inserted.length;
      }
    }
    console.log(`Seeded ${MERCHANT_SEED.length} merchants (+${aliasCount} new aliases).`);
  });

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
