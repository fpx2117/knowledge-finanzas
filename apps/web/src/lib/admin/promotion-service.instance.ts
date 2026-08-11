import { createPromotionRepository, db } from "@know-finanzas/db";
import { createGrantPromotionalProAccess, createPromotionService } from "@know-finanzas/promotions";

const repository = createPromotionRepository(db);

export const promotionService = createPromotionService({ codes: repository, grants: repository });
export const grantPromotionalProAccess = createGrantPromotionalProAccess({ repository });
