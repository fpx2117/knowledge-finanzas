import { expect, test } from "@playwright/test";

import { chooseTrial, completeProfileOnboarding, signUp } from "./support/onboarding-flow";

test("financial onboarding keeps the shared shell", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signUp(page.request, baseURL!, { name: "Financial onboarding visual", email: `financial-onboarding-${Date.now()}@example.test` });
  await completeProfileOnboarding(page);
  await chooseTrial(page);

  await expect(page).toHaveURL(/\/onboarding\/financial-onboarding$/);
  await expect(page.getByRole("heading", { name: "Creá tu primera cuenta" })).toBeVisible();
  await expect(page.locator(".onboarding-sidebar")).toBeVisible();
  await expect(page.locator(".onboarding-form-grid")).toBeVisible();
  await page.screenshot({ path: "test-results/onboarding-financial-account-desktop.png", fullPage: true });
});

test("access selection continues the onboarding visual language", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signUp(page.request, baseURL!, { name: "Access selection visual", email: `access-selection-${Date.now()}@example.test` });
  await completeProfileOnboarding(page);

  await expect(page).toHaveURL(/\/elegir-acceso$/);
  await expect(page.getByRole("heading", { name: "Elegí cómo comenzar" })).toBeVisible();
  await expect(page.locator(".onboarding-access-app")).toBeVisible();
  await expect(page.locator(".access-plan-grid")).toBeVisible();
  await page.screenshot({ path: "test-results/onboarding-access-mobile.png", fullPage: true });
});
