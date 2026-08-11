import { createFinancialProfileRepository, createOnboardingRepository, createUserRepository, db } from "@know-finanzas/db";
import { createOnboardingService } from "@/features/onboarding/services/onboarding-service";

export const onboardingService = createOnboardingService({
  onboarding: createOnboardingRepository(db),
  financialProfiles: createFinancialProfileRepository(db),
  users: createUserRepository(db),
});
