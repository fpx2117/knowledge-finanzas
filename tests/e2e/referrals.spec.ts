import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { createGrantReferralReward, createHandleReferralConversion } from "@know-finanzas/referrals";
import { createReferralRepository } from "../../packages/db/src/repositories/referrals";
import { users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("copy link → referred signup → reward visible in referrer's summary and notification center", async ({ browser, baseURL }) => {
  const referrerContext = await browser.newContext();
  const referrerPage = await referrerContext.newPage();
  const referrerEmail = `referrals-e2e-referrer-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUpCompleteOnboardingAndStartTrial(referrerPage, baseURL!, { name: "Referrer E2E", email: referrerEmail });

  await referrerPage.goto("/settings/referrals");
  const linkInput = referrerPage.getByLabel("Enlace de referidos");
  const shareUrl = await linkInput.inputValue();
  const code = new URL(shareUrl).searchParams.get("ref");
  expect(code).toBeTruthy();

  const referredContext = await browser.newContext();
  const referredEmail = `referrals-e2e-referred-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const referredSignup = await referredContext.request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: "Referred E2E", email: referredEmail, password: "UnaPasswordSegura123!", rememberMe: true, signupReferralCode: code },
  });
  expect(referredSignup.ok(), await referredSignup.text()).toBeTruthy();
  await referredContext.close();

  // Real attribution + the REFERRAL_SIGNUP notification both happen synchronously inside the
  // sign-up request's after-hook (packages/auth) — no manual seeding needed for this part.
  await referrerPage.goto("/settings/referrals");
  await expect(referrerPage.getByText("Invitación 1")).toBeVisible();
  await expect(referrerPage.getByText("Registrada")).toBeVisible();
  await expect(referrerPage.getByRole("link", { name: /Notificaciones, 1 sin leer/ })).toBeVisible();

  // No live PaidProActivated trigger exists yet (TASK-055's Notes) — simulate the referred user's
  // first paid Pro activation directly through the real HandleReferralConversion/GrantReferralReward
  // application services against the test database, exactly like a future live trigger would.
  const database = createTestDatabase();
  try {
    const [referred] = await database.db.select().from(users).where(eq(users.email, referredEmail));
    const repository = createReferralRepository(database.db);
    const handleReferralConversion = createHandleReferralConversion({ repository });
    const { reward } = await handleReferralConversion({ referredUserId: referred.id, referrerHasEffectivePaidAccess: false });
    const grantReferralReward = createGrantReferralReward({
      repository,
      grantPromotionalDays: async (input) => ({ ok: true, grantReferenceId: `e2e-grant-${input.referenceId}` }),
    });
    await grantReferralReward({ rewardId: reward!.id });
  } finally {
    await closeTestDatabase(database);
  }

  await referrerPage.goto("/settings/referrals");
  await expect(referrerPage.getByText("Pro activado")).toBeVisible();
  await expect(referrerPage.getByText("recompensa recibida")).toBeVisible();
  await expect(referrerPage.getByText("Convertidos a Pro")).toBeVisible();

  await referrerContext.close();
});
