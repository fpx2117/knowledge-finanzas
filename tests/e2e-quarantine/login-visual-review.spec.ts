import { expect, test } from "@playwright/test";

test.describe("login visual review", () => {
  test("matches the split desktop composition", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/login", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBeLessThan(500);
    expect(pageErrors).toEqual([]);
    await expect(page.locator(".auth-showcase")).toBeVisible();
    await expect(page.locator(".auth-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Contraseña" })).toBeVisible();
    await expect(page.locator(".finance-preview")).toBeVisible();
    await page.screenshot({ path: "test-results/login-visual-review-desktop.png", fullPage: true });
  });

  test("collapses to a focused mobile form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".auth-showcase")).toBeHidden();
    await expect(page.locator(".auth-mobile-brand")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
    await page.screenshot({ path: "test-results/login-visual-review-mobile.png", fullPage: true });
  });
});
