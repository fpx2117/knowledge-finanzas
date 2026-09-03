import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";

type CategoryRecord = {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  type: "INCOME" | "EXPENSE";
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: Date | null;
};

type CategoryRepository = {
  create(input: { userId: string; name: string; type: "INCOME" | "EXPENSE"; parentId: string | null }): Promise<CategoryRecord>;
  findByIdForUser(categoryId: string, userId: string): Promise<CategoryRecord | undefined>;
  findParentByIdForUser(parentId: string, userId: string): Promise<CategoryRecord | undefined>;
  listForUser(userId: string, options?: { type?: "INCOME" | "EXPENSE"; includeArchived?: boolean }): Promise<CategoryRecord[]>;
  existsActiveWithNameForUser(input: { userId: string; name: string; type: "INCOME" | "EXPENSE"; parentId: string | null; excludeCategoryId?: string }): Promise<boolean>;
  updateMetadataForUser(categoryId: string, userId: string, input: { name: string; parentId: string | null }): Promise<CategoryRecord | undefined>;
  archiveForUser(categoryId: string, userId: string, archivedAt: Date): Promise<CategoryRecord | undefined>;
};

type TaxonomyNode = { id: string; slug: string; displayName: string; type: "INCOME" | "EXPENSE" };

type TaxonomyRepository = {
  listActive(options?: { type?: "INCOME" | "EXPENSE"; level?: "GROUP" | "CATEGORY" | "SUBCATEGORY" }): Promise<TaxonomyNode[]>;
  findById(id: string): Promise<TaxonomyNode | undefined>;
};

type CategoryMapRow = {
  userCategoryId: string;
  taxonomyNodeId: string;
  taxonomySlug: string;
  source: "SEED" | "USER" | "MODEL";
  confidence: string;
};

type CategoryMapRepository = {
  listForUser(userId: string): Promise<CategoryMapRow[]>;
  upsert(input: {
    userId: string;
    userCategoryId: string;
    taxonomyNodeId: string;
    source: "SEED" | "USER" | "MODEL";
    confidence: number;
  }): Promise<unknown>;
};

type FlatTaxonomyNode = { slug: string; parentSlug: string | null; displayName: string };

export type CategoryWithMapping = CategoryRecord & {
  canonical: { nodeId: string; slug: string; path: string; source: "SEED" | "USER" | "MODEL" } | null;
};

type Dependencies = {
  categories: CategoryRepository;
  taxonomy: TaxonomyRepository;
  map: CategoryMapRepository;
  flattenTaxonomy: () => FlatTaxonomyNode[];
  gate?: ProductAccessGate;
};

async function validateName(
  repository: CategoryRepository,
  userId: string,
  name: string,
  type: "INCOME" | "EXPENSE",
  parentId: string | null,
  excludeCategoryId?: string,
) {
  if (!name) throw new ApplicationError("INVALID_INPUT", { field: "name" });
  if (await repository.existsActiveWithNameForUser({ userId, name, type, parentId, excludeCategoryId })) {
    throw new ApplicationError("INVALID_INPUT", { field: "name" });
  }
}

async function validateParent(
  repository: CategoryRepository,
  userId: string,
  parentId: string | null,
  type: "INCOME" | "EXPENSE",
  categoryId?: string,
) {
  if (!parentId) return;
  if (parentId === categoryId) throw new ApplicationError("INVALID_INPUT", { field: "parentId" });
  const parent = await repository.findParentByIdForUser(parentId, userId);
  if (!parent) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "parentId" });
  if (parent.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "parentId" });
  if (parent.type !== type) throw new ApplicationError("CATEGORY_TYPE_MISMATCH", { field: "parentId" });
  if (parent.parentId) throw new ApplicationError("INVALID_INPUT", { field: "parentId" });
}

export function createCategoryService({
  categories,
  taxonomy,
  map,
  flattenTaxonomy,
  gate = allowAllProductAccessGate,
}: Dependencies) {
  return {
    listCategories(userId: string, options: { type?: "INCOME" | "EXPENSE"; includeArchived?: boolean } = {}) {
      return categories.listForUser(userId, options);
    },

    async listCategoriesWithMapping(userId: string): Promise<CategoryWithMapping[]> {
      const [rows, mapRows] = await Promise.all([
        categories.listForUser(userId, { includeArchived: true }),
        map.listForUser(userId),
      ]);
      const flat = flattenTaxonomy();
      const nameBySlug = new Map(flat.map((n) => [n.slug, n.displayName]));
      const parentSlugBySlug = new Map(flat.map((n) => [n.slug, n.parentSlug]));
      const mapByCategory = new Map(mapRows.map((row) => [row.userCategoryId, row]));

      return rows.map((category) => {
        const mapped = mapByCategory.get(category.id);
        if (!mapped) return { ...category, canonical: null };
        const groupSlug = parentSlugBySlug.get(mapped.taxonomySlug) ?? null;
        const path = [groupSlug ? nameBySlug.get(groupSlug) : null, nameBySlug.get(mapped.taxonomySlug)]
          .filter(Boolean)
          .join(" › ");
        return {
          ...category,
          canonical: { nodeId: mapped.taxonomyNodeId, slug: mapped.taxonomySlug, path, source: mapped.source },
        };
      });
    },

    /** The canonical CATEGORY-level options a user can map a category to, for a given type. */
    async listMappableNodes(type: "INCOME" | "EXPENSE") {
      const flat = flattenTaxonomy();
      const nameBySlug = new Map(flat.map((n) => [n.slug, n.displayName]));
      const nodes = await taxonomy.listActive({ type, level: "CATEGORY" });
      return nodes
        .map((node) => {
          const group = flat.find((n) => n.slug === node.slug)?.parentSlug ?? null;
          return {
            id: node.id,
            slug: node.slug,
            label: [group ? nameBySlug.get(group) : null, node.displayName].filter(Boolean).join(" › "),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    async createCategory(userId: string, input: { name: string; type: "INCOME" | "EXPENSE"; parentId: string | null }) {
      await gate.assertCanWrite(userId);
      const name = input.name.trim();
      await validateName(categories, userId, name, input.type, input.parentId);
      await validateParent(categories, userId, input.parentId, input.type);
      return categories.create({ userId, name, type: input.type, parentId: input.parentId });
    },

    async updateCategory(userId: string, input: { categoryId: string; name: string; parentId: string | null }) {
      const category = await categories.findByIdForUser(input.categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND");
      if (category.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED");
      const name = input.name.trim();
      await validateName(categories, userId, name, category.type, input.parentId, input.categoryId);
      await validateParent(categories, userId, input.parentId, category.type, input.categoryId);
      const updated = await categories.updateMetadataForUser(input.categoryId, userId, { name, parentId: input.parentId });
      if (!updated) throw new ApplicationError("CATEGORY_NOT_FOUND");
      return updated;
    },

    async archiveCategory(userId: string, categoryId: string) {
      const category = await categories.findByIdForUser(categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND");
      if (category.status === "ARCHIVED") return category;
      const archived = await categories.archiveForUser(categoryId, userId, new Date());
      if (!archived) throw new ApplicationError("CATEGORY_NOT_FOUND");
      return archived;
    },

    /** User explicitly picks the canonical category for one of their categories. */
    async setCategoryMapping(userId: string, categoryId: string, taxonomyNodeId: string) {
      await gate.assertCanWrite(userId);
      const category = await categories.findByIdForUser(categoryId, userId);
      if (!category) throw new ApplicationError("CATEGORY_NOT_FOUND");
      const node = await taxonomy.findById(taxonomyNodeId);
      if (!node || node.type !== category.type) throw new ApplicationError("INVALID_INPUT", { field: "taxonomyNodeId" });
      return map.upsert({ userId, userCategoryId: categoryId, taxonomyNodeId, source: "USER", confidence: 1 });
    },
  };
}
