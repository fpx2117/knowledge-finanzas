import { describe, expect, it } from "vitest";
import { createCategoryService } from "../../apps/web/src/features/categories/services/category-service";

const userA = "00000000-0000-0000-0000-000000000001";
const parent = { id: "20000000-0000-0000-0000-000000000001", userId: userA, parentId: null, name: "Comida", type: "EXPENSE" as const, status: "ACTIVE" as const, archivedAt: null };

function fakeRepository() {
  const records = [parent];
  return {
    records,
    create: async (input: typeof parent) => { records.push(input); return input; },
    findByIdForUser: async (id: string, userId: string) => records.find((item) => item.id === id && item.userId === userId),
    findParentByIdForUser: async (id: string, userId: string) => records.find((item) => item.id === id && item.userId === userId),
    listForUser: async (userId: string) => records.filter((item) => item.userId === userId),
    existsActiveWithNameForUser: async () => false,
    updateMetadataForUser: async () => undefined,
    archiveForUser: async () => undefined,
  };
}

describe("category service", () => {
  it("creates a child only with an owned, active, same-type root parent", async () => {
    const repository = fakeRepository();
    const service = createCategoryService({
      categories: repository,
      taxonomy: { listActive: async () => [], findById: async () => undefined },
      map: { listForUser: async () => [], upsert: async () => undefined },
      flattenTaxonomy: () => [],
    });

    await service.createCategory(userA, { name: "Restaurantes", type: "EXPENSE", parentId: parent.id });

    expect(repository.records).toHaveLength(2);
    expect(repository.records[1]).toMatchObject({ userId: userA, parentId: parent.id, type: "EXPENSE" });
  });

  it("rejects a parent with a different type", async () => {
    const repository = fakeRepository();
    const service = createCategoryService({
      categories: repository,
      taxonomy: { listActive: async () => [], findById: async () => undefined },
      map: { listForUser: async () => [], upsert: async () => undefined },
      flattenTaxonomy: () => [],
    });

    await expect(service.createCategory(userA, { name: "Sueldo", type: "INCOME", parentId: parent.id })).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
    expect(repository.records).toHaveLength(1);
  });

  it("rejects a parent belonging to another user", async () => {
    const repository = fakeRepository();
    const service = createCategoryService({
      categories: repository,
      taxonomy: { listActive: async () => [], findById: async () => undefined },
      map: { listForUser: async () => [], upsert: async () => undefined },
      flattenTaxonomy: () => [],
    });

    await expect(service.createCategory("00000000-0000-0000-0000-000000000002", { name: "Ajena", type: "EXPENSE", parentId: parent.id })).rejects.toMatchObject({ code: "CATEGORY_NOT_FOUND" });
  });
});
