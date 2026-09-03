import { and, asc, eq, inArray } from "drizzle-orm";

import type { Database } from "../client";
import { categoryTaxonomy } from "../schema";

export type TaxonomyLevel = "GROUP" | "CATEGORY" | "SUBCATEGORY";

export function createCategoryTaxonomyRepository(database: Database) {
  return {
    listActive(options: { type?: "INCOME" | "EXPENSE"; level?: TaxonomyLevel } = {}) {
      return database
        .select()
        .from(categoryTaxonomy)
        .where(
          and(
            eq(categoryTaxonomy.active, true),
            options.type ? eq(categoryTaxonomy.type, options.type) : undefined,
            options.level ? eq(categoryTaxonomy.level, options.level) : undefined,
          ),
        )
        .orderBy(asc(categoryTaxonomy.type), asc(categoryTaxonomy.sortOrder));
    },

    findBySlug(slug: string) {
      return database
        .select()
        .from(categoryTaxonomy)
        .where(eq(categoryTaxonomy.slug, slug))
        .limit(1)
        .then(([node]) => node);
    },

    findBySlugs(slugs: string[]) {
      if (slugs.length === 0) return Promise.resolve([]);
      return database.select().from(categoryTaxonomy).where(inArray(categoryTaxonomy.slug, slugs));
    },

    findById(id: string) {
      return database
        .select()
        .from(categoryTaxonomy)
        .where(eq(categoryTaxonomy.id, id))
        .limit(1)
        .then(([node]) => node);
    },
  };
}
