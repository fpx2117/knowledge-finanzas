import {
  categories as categoriesTable,
  categoryMap as categoryMapTable,
  createCategoryMapRepository,
  createCategoryRepository,
  createCategoryTaxonomyRepository,
  db,
  flattenTaxonomy,
  starterCategories,
} from "@know-finanzas/db";

/**
 * Bridges the free-text, per-user `categories` table to the canonical
 * `category_taxonomy`. Users keep creating and renaming their own categories;
 * KNOWLEDGE provisions a sensible starter set on day one and keeps a
 * `category_map` link behind every one so analytics and the classifier can
 * resolve to the canonical spine.
 */

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export function createCategoryProvisioningService(database = db) {
  const categoryRepo = createCategoryRepository(database);
  const taxonomyRepo = createCategoryTaxonomyRepository(database);
  const mapRepo = createCategoryMapRepository(database);

  return {
    /**
     * Give a brand-new user the starter category set. No-op if they already have
     * any active categories (returning users, or someone who set up their own).
     */
    async provisionDefaultCategories(userId: string): Promise<{ created: number; skipped: boolean }> {
      const existing = await categoryRepo.listForUser(userId, { includeArchived: true });
      if (existing.length > 0) return { created: 0, skipped: true };

      const starters = [
        ...starterCategories("EXPENSE").map((s) => ({ ...s, type: "EXPENSE" as const })),
        ...starterCategories("INCOME").map((s) => ({ ...s, type: "INCOME" as const })),
      ];

      const nodes = await taxonomyRepo.findBySlugs(starters.map((s) => s.slug));
      const nodeIdBySlug = new Map(nodes.map((node) => [node.slug, node.id]));

      const created = await database.transaction(async (tx) => {
        const inserted = await tx
          .insert(categoriesTable)
          .values(starters.map((s) => ({ userId, name: s.displayName, type: s.type, parentId: null, status: "ACTIVE" as const })))
          .returning();

        // Names are unique per type in the starter set, so (type,name) matches rows back.
        const idByKey = new Map(inserted.map((row) => [`${row.type}::${normalize(row.name)}`, row.id]));
        const mapRows = starters
          .map((starter) => ({
            userId,
            userCategoryId: idByKey.get(`${starter.type}::${normalize(starter.displayName)}`),
            taxonomyNodeId: nodeIdBySlug.get(starter.slug),
            source: "SEED" as const,
            confidence: "1.000",
          }))
          .filter((row): row is typeof row & { userCategoryId: string; taxonomyNodeId: string } =>
            Boolean(row.userCategoryId && row.taxonomyNodeId),
          );

        if (mapRows.length > 0) await tx.insert(categoryMapTable).values(mapRows);
        return inserted.length;
      });

      return { created, skipped: false };
    },

    /**
     * For an existing user whose categories predate the taxonomy: link each
     * unmapped active category to a canonical node by name match. Never touches a
     * mapping the user has explicitly set.
     */
    async backfillCategoryMap(userId: string): Promise<{ mapped: number; unmapped: string[] }> {
      const [userCategories, existingMap, taxonomyCategories] = await Promise.all([
        categoryRepo.listForUser(userId, { includeArchived: false }),
        mapRepo.listForUser(userId),
        taxonomyRepo.listActive({ level: "CATEGORY" }),
      ]);

      const alreadyMapped = new Set(existingMap.map((row) => row.userCategoryId));
      const flat = flattenTaxonomy();
      const displayBySlug = new Map(flat.map((n) => [n.slug, n.displayName]));
      const byName = new Map(
        taxonomyCategories.map((node) => [`${node.type}::${normalize(displayBySlug.get(node.slug) ?? node.displayName)}`, node]),
      );

      let mapped = 0;
      const unmapped: string[] = [];

      for (const category of userCategories) {
        if (alreadyMapped.has(category.id)) continue;
        const exact = byName.get(`${category.type}::${normalize(category.name)}`);
        if (exact) {
          await mapRepo.upsertIfNotUserSet({ userId, userCategoryId: category.id, taxonomyNodeId: exact.id, source: "MODEL", confidence: 0.9 });
          mapped += 1;
          continue;
        }
        // Loose contains-match as a fallback (e.g. "Súper" -> "Supermercado").
        const loose = taxonomyCategories.find((node) => {
          if (node.type !== category.type) return false;
          const a = normalize(displayBySlug.get(node.slug) ?? node.displayName);
          const b = normalize(category.name);
          return a.includes(b) || b.includes(a);
        });
        if (loose) {
          await mapRepo.upsertIfNotUserSet({ userId, userCategoryId: category.id, taxonomyNodeId: loose.id, source: "MODEL", confidence: 0.6 });
          mapped += 1;
        } else {
          unmapped.push(category.name);
        }
      }

      return { mapped, unmapped };
    },

    resolveTaxonomyNodeForUserCategory(userCategoryId: string, userId: string) {
      return mapRepo.resolveNodeForUserCategory(userCategoryId, userId);
    },
  };
}
