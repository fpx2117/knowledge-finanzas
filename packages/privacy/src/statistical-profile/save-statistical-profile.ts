import { z } from "zod";
import { PrivacyError } from "../errors";
import {
  AGE_RANGES, EMPLOYMENT_STATUSES, HOUSEHOLD_SIZE_RANGES, INCOME_RANGES,
  REGION_CODE_PATTERN, REGION_CODE_PREFER_NOT_TO_SAY,
  type StatisticalProfileRecord,
} from "./types";

// Every field is optional/nullable — there is no "required" branch anywhere in this schema
// (Acceptance Criterion: "user can complete, partially complete, or entirely skip").
const saveStatisticalProfileInputSchema = z.object({
  ageRange: z.enum(AGE_RANGES).nullable().optional(),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).nullable().optional(),
  incomeRange: z.enum(INCOME_RANGES).nullable().optional(),
  householdSizeRange: z.enum(HOUSEHOLD_SIZE_RANGES).nullable().optional(),
  regionCode: z.string().nullable().optional().refine(
    (value) => value == null || value === REGION_CODE_PREFER_NOT_TO_SAY || REGION_CODE_PATTERN.test(value),
    { message: "regionCode must be an ISO 3166-1 alpha-2 code or PREFER_NOT_TO_SAY" },
  ),
});

export type SaveStatisticalProfileInput = z.infer<typeof saveStatisticalProfileInputSchema>;

export type StatisticalProfileRepository = {
  upsertForUser(userId: string, input: SaveStatisticalProfileInput): Promise<StatisticalProfileRecord>;
  dismissPromptForUser(userId: string, dismissedAt: Date): Promise<StatisticalProfileRecord>;
};

export function createSaveStatisticalProfile(dependencies: { repository: StatisticalProfileRepository }) {
  return async function saveStatisticalProfile(userId: string, input: SaveStatisticalProfileInput): Promise<StatisticalProfileRecord> {
    const result = saveStatisticalProfileInputSchema.safeParse(input);
    if (!result.success) throw new PrivacyError("PRIVACY_INVALID_STATISTICAL_PROFILE_FIELD", { field: result.error.issues[0]?.path.join(".") });
    return dependencies.repository.upsertForUser(userId, result.data);
  };
}

export function createDismissStatisticalProfilePrompt(dependencies: { repository: StatisticalProfileRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());
  return function dismissStatisticalProfilePrompt(userId: string) {
    return dependencies.repository.dismissPromptForUser(userId, now());
  };
}
