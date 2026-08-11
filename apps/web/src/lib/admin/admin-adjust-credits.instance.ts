import { createAICreditRepository, db } from "@know-finanzas/db";
import { createAdminAdjustCredits } from "@know-finanzas/ai";

export const adminAdjustCredits = createAdminAdjustCredits({ repository: createAICreditRepository(db) });
