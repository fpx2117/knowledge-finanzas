import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`dashboard visual review at ${viewport.name}`, async ({ page, baseURL }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.setViewportSize(viewport);
    await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: `Dashboard visual ${viewport.name}`, email: `dashboard-visual-${viewport.name}-${Date.now()}@example.test` });
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
    await expect(page.locator(".dashboard-kpis")).toBeVisible();
    await expect(page.locator(".dashboard-panel")).toHaveCount(2);
    if (viewport.name === "desktop") await expect(page.locator(".nav-icon").first()).toBeVisible();
    else await expect(page.locator(".sidebar")).toBeHidden();
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/app-visual-review-${viewport.name}.png`, fullPage: true });
  });
}
