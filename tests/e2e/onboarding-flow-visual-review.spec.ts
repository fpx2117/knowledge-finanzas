import { expect, test } from "@playwright/test";

import { signUp } from "./support/onboarding-flow";

const routes = [
  { path: "/onboarding/welcome", heading: "Bienvenido a KNOWLEDGE Finance" },
  { path: "/onboarding/basic-profile", heading: "Configurá tu moneda y país" },
  { path: "/onboarding/goal", heading: "¿Qué querés lograr primero?" },
  { path: "/onboarding/financial-context", heading: "Contanos un poco sobre vos" },
  { path: "/onboarding/statistical-profile", heading: "Personalizá tu experiencia" },
  { path: "/onboarding/privacy-consent", heading: "Tu privacidad, tus reglas" },
];

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`all onboarding routes keep visual shell at ${viewport.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize(viewport);
    await signUp(page.request, baseURL!, { name: `Onboarding shell ${viewport.name}`, email: `onboarding-shell-${viewport.name}-${Date.now()}@example.test` });

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.locator(".onboarding-app")).toBeVisible();
      await expect(page.locator(".onboarding-card")).toBeVisible();
      await expect(page.locator(".onboarding-topbar")).toBeVisible();
      if (viewport.name === "desktop") await expect(page.locator(".onboarding-sidebar")).toBeVisible();
      else await expect(page.locator(".onboarding-mobile-progress")).toBeVisible();
    }

    await page.screenshot({ path: `test-results/onboarding-flow-${viewport.name}.png`, fullPage: true });
  });
}
