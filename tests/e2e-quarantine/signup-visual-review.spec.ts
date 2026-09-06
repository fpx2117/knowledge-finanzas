import { expect, test } from "@playwright/test";

test.describe("signup visual review", () => {
  test("renders the shared desktop composition", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator(".auth-showcase")).toBeVisible();
    await expect(page.locator(".auth-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await page.screenshot({ path: "test-results/signup-visual-review-desktop.png", fullPage: true });
  });

  test("keeps the registration form usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".auth-showcase")).toBeHidden();
    await expect(page.locator(".auth-mobile-brand")).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();
    await page.screenshot({ path: "test-results/signup-visual-review-mobile.png", fullPage: true });
  });
});
