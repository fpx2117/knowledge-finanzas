import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "../../../lib/billing/product-access-gate";

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

export function createCategoryService({ categories, gate = allowAllProductAccessGate }: { categories: CategoryRepository; gate?: ProductAccessGate }) {
  return {
    async createCategory(userId: string, input: { name: string; type: "INCOME" | "EXPENSE"; parentId: string | null }) {
      await gate.assertCanWrite(userId);
      const name = input.name.trim();
      await validateName(categories, userId, name, input.type, input.parentId);
      await validateParent(categories, userId, input.parentId, input.type);
      return categories.create({ userId, name, type: input.type, parentId: input.parentId });
    },

    listCategories(userId: string, options: { type?: "INCOME" | "EXPENSE"; includeArchived?: boolean } = {}) {
      return categories.listForUser(userId, options);
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
  };
}

async function validateName(repository: CategoryRepository, userId: string, name: string, type: "INCOME" | "EXPENSE", parentId: string | null, excludeCategoryId?: string) {
  if (!name) throw new ApplicationError("INVALID_INPUT", { field: "name" });
  if (await repository.existsActiveWithNameForUser({ userId, name, type, parentId, excludeCategoryId })) {
    throw new ApplicationError("INVALID_INPUT", { field: "name" });
  }
}

async function validateParent(repository: CategoryRepository, userId: string, parentId: string | null, type: "INCOME" | "EXPENSE", categoryId?: string) {
  if (!parentId) return;
  if (parentId === categoryId) throw new ApplicationError("INVALID_INPUT", { field: "parentId" });
  const parent = await repository.findParentByIdForUser(parentId, userId);
  if (!parent) throw new ApplicationError("CATEGORY_NOT_FOUND", { field: "parentId" });
  if (parent.status === "ARCHIVED") throw new ApplicationError("CATEGORY_ARCHIVED", { field: "parentId" });
  if (parent.type !== type) throw new ApplicationError("CATEGORY_TYPE_MISMATCH", { field: "parentId" });
  if (parent.parentId) throw new ApplicationError("INVALID_INPUT", { field: "parentId" });
}
