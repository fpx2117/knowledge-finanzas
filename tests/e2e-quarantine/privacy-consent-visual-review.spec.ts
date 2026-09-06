import { expect, test } from "@playwright/test";

import { completeProfileOnboarding, signUp } from "./support/onboarding-flow";

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`privacy consent spacing at ${viewport.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize(viewport);
    await signUp(page.request, baseURL!, { name: `Privacy visual ${viewport.name}`, email: `privacy-visual-${viewport.name}-${Date.now()}@example.test` });
    await completeProfileOnboarding(page);
    await expect(page).toHaveURL(/\/elegir-acceso$/);

    await page.goto("/onboarding/privacy-consent", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Tu privacidad, tus reglas" })).toBeVisible();
    await expect(page.locator(".privacy-consent-option")).toHaveCount(2);
    await expect(page.locator(".privacy-consent-option small")).toHaveCount(2);
    await page.screenshot({ path: `test-results/privacy-consent-spacing-${viewport.name}.png`, fullPage: true });
  });
}
