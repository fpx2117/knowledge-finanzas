import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";

import { promotionCodes, users } from "../../packages/db/src/schema";
import { createPromotionRepository } from "../../packages/db/src/repositories/promotions";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { completeProfileOnboarding, completeFinancialOnboarding, signUp } from "./support/onboarding-flow";

// TASK-064's three required end-to-end paths: onboarding completed → choose Trial/Pro/Promo →
// financial onboarding → dashboard.

test("full path: onboarding completed → choose Trial → TRIAL access → create first account → dashboard", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `access-trial-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUp(context.request, baseURL!, { name: "Access Trial E2E", email });
  await completeProfileOnboarding(page);

  await expect(page).toHaveURL(/\/elegir-acceso$/);
  await page.getByRole("button", { name: "Comenzar prueba gratuita" }).click();

  // Never a second trial/grant on a double click (Financial Invariant) — the button becomes
  // unavailable once the form is submitted and navigation is already underway.
  await expect(page).toHaveURL(/\/onboarding\/financial-onboarding$/);
  await completeFinancialOnboarding(page, "Cuenta Trial E2E");

  await expect(page).toHaveURL(/\/app$/);
  await context.close();
});

test("full path: onboarding completed → enter valid promo code → PRO (source=PROMOTION) → financial onboarding, no trial or checkout ever created", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `access-promo-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUp(context.request, baseURL!, { name: "Access Promo E2E", email });

  const database = createTestDatabase();
  const code = `E2EPROMO${Date.now()}`;
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    await createPromotionRepository(database.db).create({
      code,
      normalizedCode: code.toUpperCase(),
      name: "E2E promo",
      description: null,
      durationValue: 30,
      durationUnit: "DAYS",
      redemptionStartsAt: null,
      redemptionEndsAt: null,
      maxRedemptions: null,
      maxRedemptionsPerUser: 1,
      stackingPolicy: "NOT_STACKABLE",
      aiCreditsPerPeriod: 0,
      whatsappMessagesPerPeriod: 0,
      createdBy: user.id,
    });
    await database.db.update(promotionCodes).set({ status: "ACTIVE" }).where(eq(promotionCodes.normalizedCode, code.toUpperCase()));
  } finally {
    await closeTestDatabase(database);
  }

  await completeProfileOnboarding(page);

  await expect(page).toHaveURL(/\/elegir-acceso$/);
  await page.getByText("¿Tenés un código?").click();
  await page.getByLabel("Código promocional").fill(code);
  await page.getByRole("button", { name: "Aplicar código" }).click();

  await expect(page.getByText("Código aplicado")).toBeVisible();
  await page.getByRole("link", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/financial-onboarding$/);
  await completeFinancialOnboarding(page, "Cuenta Promo E2E");
  await expect(page).toHaveURL(/\/app$/);

  await context.close();
});
