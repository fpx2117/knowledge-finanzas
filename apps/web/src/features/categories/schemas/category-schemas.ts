import { z } from "zod";

import { idSchema } from "@know-finanzas/validation";

export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);
const categoryNameSchema = z.string().trim().min(1, "Ingresá un nombre").max(120);
const parentSchema = idSchema.nullable().default(null);

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  type: categoryTypeSchema,
  parentId: parentSchema,
}).strict();

export const updateCategorySchema = z.object({
  categoryId: idSchema,
  name: categoryNameSchema,
  parentId: parentSchema,
}).strict();

export const archiveCategorySchema = z.object({ categoryId: idSchema }).strict();
