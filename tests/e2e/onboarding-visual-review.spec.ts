import { expect, test } from "@playwright/test";

import { signUp } from "./support/onboarding-flow";

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`onboarding welcome visual review at ${viewport.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize(viewport);
    await signUp(page.request, baseURL!, { name: `Onboarding visual ${viewport.name}`, email: `onboarding-visual-${viewport.name}-${Date.now()}@example.test` });
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/onboarding\/welcome$/);
    await expect(page.getByRole("heading", { name: "Bienvenido a KNOWLEDGE Finance" })).toBeVisible();
    if (viewport.name === "desktop") await expect(page.getByRole("complementary", { name: "Progreso de configuración" })).toBeVisible();
    else await expect(page.getByRole("complementary", { name: "Progreso de configuración" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Comenzar" })).toBeVisible();
    await page.screenshot({ path: `test-results/onboarding-visual-review-${viewport.name}.png`, fullPage: true });
  });
}
