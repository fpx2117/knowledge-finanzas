import {
  categoryMapRepository,
  categoryRepository,
  categoryTaxonomyRepository,
  flattenTaxonomy,
} from "@know-finanzas/db";

import { createCategoryService } from "./category-service";

// Real, db-wired category service for server actions/pages. Kept separate from
// category-service.ts so importing the pure factory/types never pulls in the db client
// or env validation — unit tests only need the former. Mirrors
// product-access-gate.ts / .instance.ts.
export const categoryService = createCategoryService({
  categories: categoryRepository,
  taxonomy: categoryTaxonomyRepository,
  map: categoryMapRepository,
  flattenTaxonomy,
});
