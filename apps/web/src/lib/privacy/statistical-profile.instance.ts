import { createStatisticalProfileRepository, db } from "@know-finanzas/db";
import { createDismissStatisticalProfilePrompt, createSaveStatisticalProfile, type StatisticalProfileRepository } from "@know-finanzas/privacy";

// packages/db's repository stores every categorical field as plain `text` (see schema.ts's
// comment on why: avoids pgEnum's ADD VALUE migration-ordering pitfalls) so Drizzle infers
// `string | null`, not the narrower literal union the domain package's port declares. The cast
// (only for the domain-service wiring below) is safe because every write path validates against
// that same union first (createSaveStatisticalProfile's Zod schema) — nothing ever persists a
// value outside it. Pages read the untyped `statisticalProfileRepository` directly when they need
// its extra methods (e.g. findForUser) that aren't part of the narrower port.
export const statisticalProfileRepository = createStatisticalProfileRepository(db);

const repository = statisticalProfileRepository as unknown as StatisticalProfileRepository;

export const saveStatisticalProfile = createSaveStatisticalProfile({ repository });
export const dismissStatisticalProfilePrompt = createDismissStatisticalProfilePrompt({ repository });
