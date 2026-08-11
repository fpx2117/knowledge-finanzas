"use server";

import { revalidatePath } from "next/cache";

import { categoryRepository } from "@know-finanzas/db";
import { mapErrorToUi } from "@/lib/errors/map-error-to-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { updateCategorySchema } from "../schemas/category-schemas";
import { createCategoryService } from "../services/category-service";

const service = createCategoryService({ categories: categoryRepository });

export async function updateCategoryAction(formData: FormData) {
  try {
    const user = await requireCurrentUser();
    const input = updateCategorySchema.parse({
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      parentId: formData.get("parentId") || null,
    });
    await service.updateCategory(user.id, input);
    revalidatePath("/settings/categories");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: mapErrorToUi(error) };
  }
}
